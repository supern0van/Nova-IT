'use client'

import { InfoIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { Sektionsrubrik, Yta } from '@/components/portal/ui-delar'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import {
  adminKonfigurationEjKoppladText,
  adminKonfigurationSkrivbar,
} from '@/lib/admin/konfiguration'
import { vaxlaAvisering } from '@/lib/store'
import type { Aviseringsinstallning } from '@/lib/types'

/**
 * Aviseringar. Styr vilka händelser som ska skicka e-post till mottagarlistan.
 */
export function AviseringarPanel({ aviseringar }: { aviseringar: Aviseringsinstallning[] }) {
  const { kan } = useAuth()
  const kanAndra = kan('hantera_systeminstallningar') && adminKonfigurationSkrivbar
  const [sparar, setSparar] = useState<string | null>(null)

  async function vaxla(avisering: Aviseringsinstallning) {
    setSparar(avisering.id)
    try {
      await vaxlaAvisering(avisering.id)
      toast.success(
        avisering.aktiv
          ? `"${avisering.namn}" är avstängd`
          : `"${avisering.namn}" är påslagen`,
      )
    } finally {
      setSparar(null)
    }
  }

  const antalAktiva = aviseringar.filter((a) => a.aktiv).length

  return (
    <Yta className="flex flex-col gap-4 p-3.5">
      <Sektionsrubrik antal={antalAktiva}>Aktiva aviseringar</Sektionsrubrik>

      <p className="flex items-start gap-2 rounded-lg bg-surface-emphasis p-2.5 text-[12px] leading-relaxed text-muted-foreground">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
        <span>
          {adminKonfigurationEjKoppladText} Ingen riktig e-post skickas från dessa val i nuläget.
        </span>
      </p>

      <ul className="flex flex-col gap-1.5">
        {aviseringar.map((avisering) => (
          <li
            key={avisering.id}
            className="flex items-start justify-between gap-4 rounded-lg bg-surface-emphasis p-3"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-[13px] font-medium">{avisering.namn}</p>
              <p className="text-pretty text-[12px] leading-relaxed text-muted-foreground">
                {avisering.beskrivning}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {sparar === avisering.id && <Spinner className="size-3.5 text-muted-foreground" />}
              <Switch
                checked={avisering.aktiv}
                disabled={!kanAndra || sparar === avisering.id}
                onCheckedChange={() => vaxla(avisering)}
                aria-label={`Avisering: ${avisering.namn}`}
              />
            </div>
          </li>
        ))}
      </ul>

      {!adminKonfigurationSkrivbar ? (
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Skrivning är avstängd här för att undvika att lokala demoändringar misstas för
          produktionsinställningar.
        </p>
      ) : !kanAndra ? (
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Din roll kan läsa aviseringarna men inte ändra dem.
        </p>
      ) : null}
    </Yta>
  )
}
