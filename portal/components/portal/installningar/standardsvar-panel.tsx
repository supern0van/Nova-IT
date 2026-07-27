'use client'

import { ChevronDownIcon } from 'lucide-react'

import { Sektionsrubrik, Yta } from '@/components/portal/ui-delar'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { adminKonfigurationEjKoppladText } from '@/lib/admin/konfiguration'
import type { Standardsvar } from '@/lib/types'

/**
 * Standardsvar. Läsläge tills standardsvar har riktig serverlagring.
 */
export function StandardsvarPanel({ standardsvar }: { standardsvar: Standardsvar[] }) {
  return (
    <Yta className="flex flex-col gap-4 p-3.5">
      <Sektionsrubrik antal={standardsvar.length}>Standardsvar</Sektionsrubrik>

      <p className="rounded-lg bg-surface-emphasis p-2.5 text-[12px] leading-relaxed text-muted-foreground">
        {adminKonfigurationEjKoppladText} Texterna används i svarsrutan på ett ärende.
        Platshållarna{' '}
        <code className="rounded bg-card px-1 py-0.5 text-[11px]">{'{{kundnamn}}'}</code> och{' '}
        <code className="rounded bg-card px-1 py-0.5 text-[11px]">{'{{tekniker}}'}</code> fylls i
        automatiskt när svaret används.
      </p>

      <ul className="flex flex-col gap-1.5">
        {standardsvar.map((svar) => (
          <li key={svar.id} className="rounded-lg bg-surface-emphasis p-3">
            <Collapsible>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CollapsibleTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="group -ml-2 h-auto py-1 font-medium"
                    >
                      <ChevronDownIcon
                        data-icon="inline-start"
                        className="transition-transform group-data-panel-open:rotate-180"
                      />
                      {svar.rubrik}
                    </Button>
                  }
                />
                <span className="rounded-md bg-card px-2 py-0.5 text-[11px] leading-5 text-muted-foreground">
                  {svar.kategori}
                </span>
              </div>
              <CollapsibleContent>
                <p className="mt-2 whitespace-pre-wrap text-pretty rounded-lg bg-card p-2.5 text-[13px] leading-relaxed text-text-secondary">
                  {svar.text}
                </p>
              </CollapsibleContent>
            </Collapsible>
          </li>
        ))}
      </ul>

      <p className="text-[12px] leading-relaxed text-muted-foreground">
        Redigering är avstängd tills standardsvaren sparas server-side.
      </p>
    </Yta>
  )
}
