'use client'

import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import {
  authAdapter,
  harBehorighet,
  type Behorighet,
  type InloggningsFel,
  type Session,
} from '@/lib/auth/supabase-auth'
import { hamtaRollFranApiSvar } from '@/lib/auth/roll-api-svar'
import { arAdministrator, type SystemRoll } from '@/lib/auth/roll'
import { arDemogastEpost } from '@/lib/auth/demo-guest'
import {
  INAKTIVITETS_TIMEOUT_MS,
  SENAST_AKTIV_NYCKEL,
  SESSIONSKONTROLL_INTERVALL_MS,
} from '@/lib/auth/session-timeouts'
import type { Anvandare } from '@/lib/types'

/**
 * Applikationens enda ingång till autentisering.
 *
 * Komponenter använder `useAuth()` och behöver inte veta att sessionen
 * kommer från Supabase Auth. Byt implementation i `lib/auth/supabase-auth.ts`
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
  /** Millisekunder tills automatisk utloggning på grund av inaktivitet. */
  inaktivitetKvarMs: number | null
  /** Återställer inaktivitetstimern efter en uttrycklig användaråtgärd. */
  fornyaAktivitet: () => void
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

const SYSTEM_ADMIN_BEHORIGHETER: readonly Behorighet[] = [
  'se_installningar',
  'hantera_anvandare',
  'hantera_systeminstallningar',
]

function initialerFranNamn(namn: string) {
  return (
    namn
      .trim()
      .split(/\s+/)
      .map((del) => del[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [anvandare, setAnvandare] = useState<Anvandare | null>(null)
  const [initierar, setInitierar] = useState(true)
  const [loggarIn, setLoggarIn] = useState(false)
  const [sessionUtgick, setSessionUtgick] = useState(false)
  const [inaktivitetKvarMs, setInaktivitetKvarMs] = useState<number | null>(null)
  const [roll, setRoll] = useState<SystemRoll | null>(null)
  const [laddarRoll, setLaddarRoll] = useState(false)
  // Höjs varje gång Supabase fyrar `MFA_CHALLENGE_VERIFIED` (dvs. när
  // sessionen precis gått från `aal1` till `aal2`). Roll-hämtningseffekten
  // nedan lyssnar på det här värdet också – annars skulle /api/roll (som nu
  // kräver `aal2`, se lib/supabase/route-anvandare.ts) förbli 401 tills
  // nästa hela sidladdning, trots att användaren just blivit MFA-verifierad.
  const [mfaVerifieradVersion, setMfaVerifieradVersion] = useState(0)

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
    const avregistrera = authAdapter.lyssnaPaSessionsandringar((varde, handelse) => {
      setSession(varde?.session ?? null)
      setAnvandare(varde?.anvandare ?? null)
      if (handelse === 'MFA_CHALLENGE_VERIFIED') {
        setMfaVerifieradVersion((v) => v + 1)
      }
    })
    return avregistrera
  }, [])

  // Bevaka utgången session medan portalen är öppen.
  useEffect(() => {
    if (!session) return
    if (typeof window === 'undefined') return

    const nu = Date.now()
    const sparadSenastAktiv = Number(window.sessionStorage.getItem(SENAST_AKTIV_NYCKEL))
    let senastAktiv = Number.isFinite(sparadSenastAktiv) && sparadSenastAktiv > 0 ? sparadSenastAktiv : nu
    window.sessionStorage.setItem(SENAST_AKTIV_NYCKEL, String(senastAktiv))

    let utloggningPagar = false
    let senasteAktivitetsSkrivning = 0
    let senasteServerPing = 0
    const registreraAktivitet = () => {
      const tid = Date.now()
      if (tid - senasteAktivitetsSkrivning < 1000) return
      senasteAktivitetsSkrivning = tid
      senastAktiv = tid
      window.sessionStorage.setItem(SENAST_AKTIV_NYCKEL, String(tid))
      setInaktivitetKvarMs(INAKTIVITETS_TIMEOUT_MS)
      if (tid - senasteServerPing >= 60_000) {
        senasteServerPing = tid
        void fetch('/api/session/lease', { method: 'POST', credentials: 'same-origin', keepalive: true }).catch(() => {})
      }
    }

    const loggaUtEfterInaktivitet = async () => {
      if (utloggningPagar) return
      utloggningPagar = true
      await authAdapter.loggaUt()
      window.sessionStorage.removeItem(SENAST_AKTIV_NYCKEL)
      setSession(null)
      setAnvandare(null)
      setRoll(null)
      setSessionUtgick(true)
      setMfaVerifieradVersion(0)
      router.replace('/logga-in')
    }

    const kontrolleraSession = () => {
      if (session.upphorVid !== null && Date.now() > session.upphorVid) {
        setSession(null)
        setAnvandare(null)
        setInaktivitetKvarMs(null)
        window.sessionStorage.removeItem(SENAST_AKTIV_NYCKEL)
        setSessionUtgick(true)
        router.replace('/logga-in')
        return
      }

      if (Date.now() - senastAktiv >= INAKTIVITETS_TIMEOUT_MS) {
        void loggaUtEfterInaktivitet()
        return
      }
      setInaktivitetKvarMs(Math.max(0, INAKTIVITETS_TIMEOUT_MS - (Date.now() - senastAktiv)))
    }

    const aktivitetsHändelser = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const
    aktivitetsHändelser.forEach((händelse) => window.addEventListener(händelse, registreraAktivitet, { passive: true }))
    const intervall = setInterval(kontrolleraSession, SESSIONSKONTROLL_INTERVALL_MS)
    setInaktivitetKvarMs(Math.max(0, INAKTIVITETS_TIMEOUT_MS - (nu - senastAktiv)))
    return () => {
      aktivitetsHändelser.forEach((händelse) => window.removeEventListener(händelse, registreraAktivitet))
      clearInterval(intervall)
      setInaktivitetKvarMs(null)
    }
  }, [session, router])

  const fornyaAktivitet = useCallback(() => {
    if (typeof window === 'undefined' || !session) return
    const tid = Date.now()
    window.sessionStorage.setItem(SENAST_AKTIV_NYCKEL, String(tid))
    setInaktivitetKvarMs(INAKTIVITETS_TIMEOUT_MS)
    void fetch('/api/session/lease', { method: 'POST', credentials: 'same-origin', keepalive: true }).catch(() => {})
  }, [session])

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
      .then((data: unknown) => {
        if (avbruten) return
        const rollSvar = hamtaRollFranApiSvar(data)
        setRoll(rollSvar?.roll ?? null)
        if (rollSvar?.profil) {
          setAnvandare((aktuell) => {
            if (!aktuell || aktuell.id !== anvandareId) return aktuell
            const namn = rollSvar.profil?.namn.trim() || aktuell.namn
            const epost = rollSvar.profil?.epost.trim() || aktuell.epost
            return {
              ...aktuell,
              namn,
              epost,
              initialer: initialerFranNamn(namn || epost.split('@')[0] || aktuell.namn),
            }
          })
        }
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
  }, [anvandare?.id, mfaVerifieradVersion])

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
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(SENAST_AKTIV_NYCKEL, String(Date.now()))
        }
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
    setInaktivitetKvarMs(null)
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(SENAST_AKTIV_NYCKEL)
    }
    setSessionUtgick(false)
    setMfaVerifieradVersion(0)
    router.replace('/logga-in')
    return { ok: true as const }
  }, [router])

  const kan = useCallback(
    (behorighet: Behorighet) => {
      if (!anvandare) return false
      if (arDemogastEpost(anvandare.epost)) return behorighet === 'se_alla_arenden'
      if (SYSTEM_ADMIN_BEHORIGHETER.includes(behorighet) && !arAdministrator(roll)) return false
      return harBehorighet(anvandare.roll, behorighet)
    },
    [anvandare, roll],
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
      inaktivitetKvarMs,
      fornyaAktivitet,
      roll,
      laddarRoll,
    }),
    [
      anvandare,
      session,
      initierar,
      loggarIn,
      loggaIn,
      loggaUt,
      kan,
      sessionUtgick,
      inaktivitetKvarMs,
      fornyaAktivitet,
      roll,
      laddarRoll,
    ],
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
