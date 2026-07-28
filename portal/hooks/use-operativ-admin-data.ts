'use client'

import { useCallback, useEffect, useState } from 'react'

import { hamtaDatabas, type Databas } from '@/lib/store'
import type { Aktivitet, Arende, Bokning, Kund, Kundanteckning, Meddelande } from '@/lib/types'

interface OperativApiData {
  kunder: Kund[]
  arenden: Arende[]
  bokningar: Bokning[]
  meddelanden: Meddelande[]
  aktiviteter: Aktivitet[]
  kundanteckningar: Kundanteckning[]
}

/**
 * Läser adminportalens operativa kärndata från det skyddade server-API:t.
 *
 * Kategorier, standardsvar och vissa historikdelar ligger kvar i det gamla
 * lokala underlaget tills nästa omkopplingssteg, men kunder/ärenden/bokningar
 * kommer från Supabase när `/api/admin/operativt` svarar korrekt.
 */
export function useOperativAdminData() {
  const [db, setDb] = useState<Databas | null>(null)
  const [laddar, setLaddar] = useState(true)
  const [fel, setFel] = useState(false)

  const las = useCallback(async () => {
    const lokaltUnderlag = hamtaDatabas()

    try {
      const svar = await fetch('/api/admin/operativt', { cache: 'no-store' })
      if (!svar.ok) throw new Error('Operativt API nekade anropet.')

      const data = normaliseraOperativApiData(await svar.json())
      if (!data) throw new Error('Operativt API returnerade oväntat format.')

      setDb({
        ...lokaltUnderlag,
        kunder: data.kunder,
        arenden: data.arenden,
        bokningar: data.bokningar,
        meddelanden: data.meddelanden,
        aktiviteter: data.aktiviteter,
        kundanteckningar: data.kundanteckningar,
      })
      setFel(false)
    } catch {
      setDb(
        process.env.NODE_ENV === 'production'
          ? {
              ...lokaltUnderlag,
              kunder: [],
              arenden: [],
              bokningar: [],
              meddelanden: [],
              aktiviteter: [],
              kundanteckningar: [],
            }
          : lokaltUnderlag,
      )
      setFel(true)
    } finally {
      setLaddar(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      void las()
    }, 220)

    function vidUppdatering() {
      void las()
    }

    window.addEventListener('nova-it:data-uppdaterad', vidUppdatering)
    window.addEventListener('storage', vidUppdatering)

    return () => {
      clearTimeout(t)
      window.removeEventListener('nova-it:data-uppdaterad', vidUppdatering)
      window.removeEventListener('storage', vidUppdatering)
    }
  }, [las])

  return { db, laddar, fel, uppdatera: las }
}

function normaliseraOperativApiData(data: unknown): OperativApiData | null {
  if (typeof data !== 'object' || data === null) return null
  if (
    !('kunder' in data) ||
    !('arenden' in data) ||
    !('bokningar' in data) ||
    !('meddelanden' in data) ||
    !('aktiviteter' in data) ||
    !('kundanteckningar' in data)
  ) {
    return null
  }
  if (
    !Array.isArray(data.kunder) ||
    !Array.isArray(data.arenden) ||
    !Array.isArray(data.bokningar) ||
    !Array.isArray(data.meddelanden) ||
    !Array.isArray(data.aktiviteter) ||
    !Array.isArray(data.kundanteckningar)
  ) {
    return null
  }

  return {
    kunder: data.kunder as Kund[],
    arenden: data.arenden as Arende[],
    bokningar: data.bokningar as Bokning[],
    meddelanden: data.meddelanden as Meddelande[],
    aktiviteter: data.aktiviteter as Aktivitet[],
    kundanteckningar: data.kundanteckningar as Kundanteckning[],
  }
}
