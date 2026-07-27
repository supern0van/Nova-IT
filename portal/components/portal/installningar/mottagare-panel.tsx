'use client'

import { MailPlusIcon, MailXIcon } from 'lucide-react'

import { Sektionsrubrik, Yta } from '@/components/portal/ui-delar'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Switch } from '@/components/ui/switch'
import { adminKonfigurationEjKoppladText } from '@/lib/admin/konfiguration'
import type { EpostMottagare } from '@/lib/types'

/**
 * E-postmottagare. Läsläge tills mottagarlistan har riktig serverlagring och
 * e-postflödet är kopplat.
 */
export function MottagarePanel({ mottagare }: { mottagare: EpostMottagare[] }) {
  return (
    <Yta className="flex flex-col gap-4 p-3.5">
      <Sektionsrubrik antal={mottagare.length}>E-postmottagare</Sektionsrubrik>

      <p className="rounded-lg bg-surface-emphasis p-2.5 text-[12px] leading-relaxed text-muted-foreground">
        {adminKonfigurationEjKoppladText}
      </p>

      {mottagare.length === 0 ? (
        <Empty className="bg-surface-emphasis py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MailXIcon />
            </EmptyMedia>
            <EmptyTitle>Inga mottagare</EmptyTitle>
            <EmptyDescription>
              Utan mottagare finns det ingen som får aviseringarna.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {mottagare.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-emphasis p-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <MailPlusIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate text-[13px] font-medium">{m.epost}</p>
                  <p className="text-[12px] text-muted-foreground">{m.syfte}</p>
                </div>
              </div>

              <Switch checked={m.aktiv} disabled aria-label={`Aviseringar till ${m.epost}`} />
            </li>
          ))}
        </ul>
      )}

      <p className="text-[12px] leading-relaxed text-muted-foreground">
        Lägg till, pausa och ta bort är avstängt tills mottagarlistan sparas server-side.
      </p>
    </Yta>
  )
}
