'use client'

import {
  ArrowRightLeftIcon,
  CalendarIcon,
  FlagIcon,
  MessageSquareIcon,
  PaperclipIcon,
  SmartphoneIcon,
  SparklesIcon,
  StickyNoteIcon,
  UserCheckIcon,
} from 'lucide-react'

import { Sektionsrubrik } from '@/components/portal/ui-delar'
import { formateraDatumTid } from '@/lib/labels'
import type { Aktivitet } from '@/lib/types'

const ikoner: Record<Aktivitet['typ'], typeof FlagIcon> = {
  skapat: SparklesIcon,
  status: ArrowRightLeftIcon,
  prioritet: FlagIcon,
  tilldelning: UserCheckIcon,
  meddelande: MessageSquareIcon,
  anteckning: StickyNoteIcon,
  bokning: CalendarIcon,
  bilaga: PaperclipIcon,
  sms: SmartphoneIcon,
}

/**
 * Händelselogg för ärendet. Byggs av `loggaAktivitet` i datalagret, så samma
 * lista fungerar oförändrad mot en riktig aktivitetstabell.
 */
export function Tidslinje({ aktiviteter }: { aktiviteter: Aktivitet[] }) {
  return (
    <section className="flex flex-col gap-3">
      <Sektionsrubrik antal={aktiviteter.length}>Händelser</Sektionsrubrik>

      {aktiviteter.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">Inga händelser registrerade.</p>
      ) : (
        <ol className="flex flex-col">
          {aktiviteter.map((a, index) => {
            const Ikon = ikoner[a.typ]
            const sist = index === aktiviteter.length - 1
            return (
              <li key={a.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-emphasis text-muted-foreground">
                    <Ikon className="size-3.5" aria-hidden />
                  </span>
                  {!sist && <span className="w-px flex-1 bg-border" />}
                </div>
                <div className={sist ? 'flex flex-col gap-0.5' : 'flex flex-col gap-0.5 pb-4'}>
                  <p className="text-pretty text-[13px] leading-relaxed">{a.beskrivning}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {a.aktor} · {formateraDatumTid(a.tidpunkt)}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
