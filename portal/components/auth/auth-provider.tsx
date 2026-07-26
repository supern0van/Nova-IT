'use client'

import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import {
  authAdapter,
  hamtaAnvandare,
  harBehorighet,
  type Behorighet,
  type InloggningsFel,
  type Session,
} from '@/lib/auth/demo-auth'
import type { Anvandare } from '@/lib/types'

/**
 * Applikationens enda ingång till autentisering.
 *
 * Komponenter använder `useAuth()` och behöver inte veta om sessionen kommer
 * från localStorage (demo) eller från Supabase/Clerk/egen backend (produktion).
 * Byt implementation i `lib/auth/demo-auth.ts` – inte här.
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
  loggaUt: () => Promise<void>
  kan: (behorighet: Behorighet) => boolean
  /** Sätts när sessionen gått ut, så inloggningssidan kan förklara varför. */
  sessionUtgick: boolean
  rensaSessionUtgick: () => void
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

  // Läs in befintlig session vid start.
  useEffect(() => {
    const befintlig = authAdapter.hamtaSession()
    if (befintlig) {
      setSession(befintlig)
      setAnvandare(hamtaAnvandare(befintlig.anvandareId) ?? null)
    }
    setInitierar(false)
  }, [])

  // Bevaka utgången session medan portalen är öppen.
  useEffect(() => {
    if (!session) return
    const intervall = setInterval(() => {
      if (Date.now() > session.upphorVid) {
        setSession(null)
        setAnvandare(null)
        setSessionUtgick(true)
        router.replace('/logga-in')
      }
    }, KONTROLL_INTERVALL_MS)
    return () => clearInterval(intervall)
  }, [session, router])

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
    await authAdapter.loggaUt()
    setSession(null)
    setAnvandare(null)
    setSessionUtgick(false)
    router.replace('/logga-in')
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
    }),
    [anvandare, session, initierar, loggarIn, loggaIn, loggaUt, kan, sessionUtgick],
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
