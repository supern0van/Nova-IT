import { CheckIcon } from 'lucide-react'

import { statusLabel } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { ArendeStatus } from '@/lib/types'

const STEG = ['Mottaget', 'Vi arbetar med det', 'Klart'] as const

/** Vilket av de tre stegen ovan ett givet ärendestatus motsvarar. Speglar
 * exakt samma mappning som kundportalens Framstegssparning
 * (Nova-IT-Kundportal, components/ui/framstegssparning.tsx) - personal ska
 * se precis det kunden ser, inte en egen tolkning. */
function stegForStatus(status: ArendeStatus): number {
  if (status === 'ny') return 0
  if (status === 'lost' || status === 'stangd') return 2
  return 1 // pagaende, vantar_pa_kund, bokad
}

/**
 * Visar samma steg-för-steg-vy som kunden ser i kundportalen, så att
 * personal aldrig behöver gissa vad ett statusnamn betyder ur kundens
 * perspektiv. Rent visuellt komplement till den redan befintliga
 * statusdropdownen i ArendeAtgarder - byter INTE ut den, styr ingenting
 * självt.
 */
export function Framstegssparning({ status }: { status: ArendeStatus }) {
  const aktivtSteg = stegForStatus(status)
  const vantarPaKund = status === 'vantar_pa_kund'

  return (
    <div className="flex flex-col gap-2">
      <ol className="flex items-center">
        {STEG.map((steg, index) => {
          const klar = index < aktivtSteg
          const aktiv = index === aktivtSteg
          return (
            <li key={steg} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    'grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold',
                    klar && 'border-success bg-success text-background',
                    aktiv && !klar && 'border-primary bg-primary text-primary-foreground',
                    !aktiv && !klar && 'border-border bg-surface-emphasis text-muted-foreground',
                  )}
                >
                  {klar ? <CheckIcon className="size-3.5" aria-hidden /> : index + 1}
                </span>
                <span
                  className={cn(
                    'max-w-20 text-center text-[11px] font-medium',
                    aktiv || klar ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {steg}
                </span>
              </div>
              {index < STEG.length - 1 && (
                <span
                  className={cn('mx-2 h-0.5 flex-1 rounded-full', klar ? 'bg-success' : 'bg-border')}
                  aria-hidden
                />
              )}
            </li>
          )
        })}
      </ol>
      {vantarPaKund && (
        <p className="text-center text-[12px] font-medium text-warning">
          Kunden ser: {statusLabel.vantar_pa_kund}
        </p>
      )}
    </div>
  )
}
