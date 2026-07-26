'use client'

import { useCallback, useEffect, useState } from 'react'

import { hamtaDatabas, type Databas } from '@/lib/store'

/**
 * Läser demodatalagret och håller sig synkroniserat.
 *
 * Alla skrivningar i `lib/store.ts` skickar händelsen
 * `nova-it:data-uppdaterad`, vilket får samtliga monterade vyer att läsa om.
 * När lagret byts mot ett riktigt API ersätts denna hook lämpligen av SWR.
 */
export function useDemoData() {
  const [db, setDb] = useState<Databas | null>(null)
  const [laddar, setLaddar] = useState(true)

  const las = useCallback(() => {
    setDb(hamtaDatabas())
  }, [])

  useEffect(() => {
    // Kort fördröjning så att skelettlägen hinner visas vid första render.
    const t = setTimeout(() => {
      las()
      setLaddar(false)
    }, 220)

    function vidUppdatering() {
      las()
    }

    window.addEventListener('nova-it:data-uppdaterad', vidUppdatering)
    window.addEventListener('storage', vidUppdatering)

    return () => {
      clearTimeout(t)
      window.removeEventListener('nova-it:data-uppdaterad', vidUppdatering)
      window.removeEventListener('storage', vidUppdatering)
    }
  }, [las])

  return { db, laddar, uppdatera: las }
}
