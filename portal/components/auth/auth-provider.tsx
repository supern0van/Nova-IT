'use client'

import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import {
  authAdapter,
  harBehorighet,
  type Behorighet,
  type InloggningsFel,
  type Session,
} from '@/lib/auth/demo-auth'
import type { SystemRoll } from '@/lib/auth/roll'
import type { Anvandare } from '@/lib/types'

/**
 * Applikationens enda ingång till autentisering.
 *
 * Komponenter använder `useAuth()` och behöver inte veta att sessionen
 * kommer från Supabase Auth. Byt implementation i `lib/auth/demo-auth.ts`
 * – inte här.
 */

interface AuthContextVarde {
  anvandare: Anvandare | null
  session: Session | null
  /** true medan sessionen läses in första gången. */
  initierar: boolean
  loggarIn: boolean
  loggaIn: (
    epost: string,
    losenord: string,
    ihagkommen: boolean,
  ) => Promise<{ ok: boolean; fel?: InloggningsFel }>
  loggaUt: () => Promise<{ ok: boolean }>
  kan: (behorighet: Behorighet) => boolean
  /** Sätts när sessionen gått ut, så inloggningssidan kan förklara varför. */
  sessionUtgick: boolean
  rensaSessionUtgick: () => void
  /**
   * Den inloggade användarens systemroll (`SystemRoll` – 'administrator' |
   * 'medarbetare'), hämtad från `profiles`-tabellen via `/api/roll` (aldrig
   * litad på från klienten – se `lib/auth/roll.ts`). Detta är INTE samma sak
   * som personal-/teknikerrollen (`Anvandare.roll`, typen `Roll` i
   * `lib/types.ts`) som styr `kan()`/`harBehorighet()` ovan.
   * `null` innan den lästs in första gången, eller om användaren är
   * utloggad.
   */
  roll: SystemRoll | null
  /** true medan `roll` läses in (efter inloggning eller vid sidladdning). */
  laddarRoll: boolean
}

const AuthContext = createContext<AuthContextVarde | null>(null)

const KONTROLL_INTERVALL_MS = 30_000

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [anvandare, setAnvandare] = useState<Anvandare | null>(null)
  const [initierar, setInitierar] = useState(true)
  const [loggarIn, setLoggarIn] = useState(false)
  const [sessionUtgick, setSessionUtgick] = useState(false)
  const [roll, setRoll] = useState<SystemRoll | null>(null)
  const [laddarRoll, setLaddarRoll] = useState(false)

  // Läs in befintlig Supabase-session vid start.
  useEffect(() => {
    let avbruten = false
    authAdapter.hamtaSession().then((befintlig) => {
      if (avbruten) return
      setSession(befintlig?.session ?? null)
      setAnvandare(befintlig?.anvandare ?? null)
      setInitierar(false)
    })
    return () => {
      avbruten = true
    }
  }, [])

  // Lyssna på förändringar i Supabase-sessionen (t.ex. tokenuppdatering,
  // eller att sessionen upphör/blir ogiltig medan portalen är öppen).
  // Sätter INTE `sessionUtgick` här: avsiktlig utloggning (`loggaUt`) ger
  // samma händelse (session blir null) och ska inte visas som en utgången
  // session. Den lokala utgångsbevakningen nedan äger det ansvaret.
  useEffect(() => {
    const avregistrera = authAdapter.lyssnaPaSessionsandringar((varde) => {
      setSession(varde?.session ?? null)
      setAnvandare(varde?.anvandare ?? null)
    })
    return avregistrera
  }, [])

  // Bevaka utgången session medan portalen är öppen.
  useEffect(() => {
    if (!session) return
    const intervall = setInterval(() => {
      if (session.upphorVid !== null && Date.now() > session.upphorVid) {
        setSession(null)
        setAnvandare(null)
        setSessionUtgick(true)
        router.replace('/logga-in')
      }
    }, KONTROLL_INTERVALL_MS)
    return () => clearInterval(intervall)
  }, [session, router])

  // Hämta den inloggade användarens roll från databasen (via /api/roll).
  // Körs vid inloggning och vid sidladdning med befintlig session – aldrig
  // utifrån ett värde klienten själv sätter. Nyckeln på `anvandare.id` (inte
  // hela `anvandare`-objektet) undviker onödiga omfrågningar vid t.ex.
  // token-uppdateringar där samma användare bara får ett nytt sessionsobjekt.
  useEffect(() => {
    const anvandareId = anvandare?.id
    if (!anvandareId) {
      setRoll(null)
      setLaddarRoll(false)
      return
    }

    let avbruten = false
    setLaddarRoll(true)
    fetch('/api/roll')
      .then((svar) => (svar.ok ? svar.json() : { roll: null }))
      .then((data: { roll: SystemRoll | null }) => {
        if (!avbruten) setRoll(data.roll)
      })
      .catch(() => {
        if (!avbruten) setRoll(null)
      })
      .finally(() => {
        if (!avbruten) setLaddarRoll(false)
      })

    return () => {
      avbruten = true
    }
  }, [anvandare?.id])

  const loggaIn = useCallback(
    async (epost: string, losenord: string, ihagkommen: boolean) => {
      setLoggarIn(true)
      setSessionUtgick(false)
      try {
        const resultat = await authAdapter.loggaIn(epost, losenord, ihagkommen)
        if (!resultat.ok) {
          return { ok: false as const, fel: resultat.fel }
        }
        setSession(resultat.session)
        setAnvandare(resultat.anvandare)
        return { ok: true as const }
      } finally {
        setLoggarIn(false)
      }
    },
    [],
  )

  const loggaUt = useCallback(async () => {
    const resultat = await authAdapter.loggaUt()
    if (!resultat.ok) {
      // Behåll ett konsekvent auth-state: låtsas inte att utloggningen
      // lyckades om Supabase signOut() misslyckades.
      return { ok: false as const }
    }
    setSession(null)
    setAnvandare(null)
    setSessionUtgick(false)
    router.replace('/logga-in')
    return { ok: true as const }
  }, [router])

  const kan = useCallback(
    (behorighet: Behorighet) => (anvandare ? harBehorighet(anvandare.roll, behorighet) : false),
    [anvandare],
  )

  const varde = useMemo<AuthContextVarde>(
    () => ({
      anvandare,
      session,
      initierar,
      loggarIn,
      loggaIn,
      loggaUt,
      kan,
      sessionUtgick,
      rensaSessionUtgick: () => setSessionUtgick(false),
      roll,
      laddarRoll,
    }),
    [anvandare, session, initierar, loggarIn, loggaIn, loggaUt, kan, sessionUtgick, roll, laddarRoll],
  )

  return <AuthContext.Provider value={varde}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth måste användas inom en AuthProvider.')
  }
  return ctx
}
