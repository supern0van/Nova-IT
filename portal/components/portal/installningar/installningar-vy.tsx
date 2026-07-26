'use client'

import { BellIcon, MailIcon, MessageSquareTextIcon, ServerIcon, TagsIcon } from 'lucide-react'
import { useState } from 'react'

import { AviseringarPanel } from '@/components/portal/installningar/aviseringar-panel'
import { KategorierPanel } from '@/components/portal/installningar/kategorier-panel'
import { MottagarePanel } from '@/components/portal/installningar/mottagare-panel'
import { StandardsvarPanel } from '@/components/portal/installningar/standardsvar-panel'
import { SystemPanel } from '@/components/portal/installningar/system-panel'
import { Sida, Sidhuvud, Yta } from '@/components/portal/ui-delar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDemoData } from '@/hooks/use-demo-data'

type Flik = 'aviseringar' | 'mottagare' | 'kategorier' | 'standardsvar' | 'system'

/**
 * Inställningsmodulen. Samlar de systemval som tidigare bara fanns i datalagret
 * men aldrig hade någon vy: aviseringar, e-postmottagare, ärendekategorier,
 * standardsvar och systemöversikt.
 *
 * Panelerna är rena presentationslager. All skrivning sker i `lib/store.ts`,
 * som i sin tur skickar `nova-it:data-uppdaterad` så att vyn läser om sig själv.
 */
export function InstallningarVy() {
  const { db, laddar } = useDemoData()
  const [flik, setFlik] = useState<Flik>('aviseringar')

  if (laddar || !db) {
    return (
      <Sida>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-full max-w-[540px] rounded-lg" />
        <Yta className="flex flex-col gap-3 p-3.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </Yta>
      </Sida>
    )
  }

  return (
    <Sida>
      <Sidhuvud
        rubrik="Inställningar"
        beskrivning="Styr aviseringar, mottagare, ärendekategorier och standardsvar för Nova IT. Ändringarna sparas i den här demosessionen."
      />

      <Tabs value={flik} onValueChange={(v) => setFlik(v as Flik)}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="aviseringar">
            <BellIcon data-icon="inline-start" />
            Aviseringar
          </TabsTrigger>
          <TabsTrigger value="mottagare">
            <MailIcon data-icon="inline-start" />
            Mottagare
          </TabsTrigger>
          <TabsTrigger value="kategorier">
            <TagsIcon data-icon="inline-start" />
            Kategorier
          </TabsTrigger>
          <TabsTrigger value="standardsvar">
            <MessageSquareTextIcon data-icon="inline-start" />
            Standardsvar
          </TabsTrigger>
          <TabsTrigger value="system">
            <ServerIcon data-icon="inline-start" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aviseringar">
          <AviseringarPanel aviseringar={db.aviseringar} />
        </TabsContent>
        <TabsContent value="mottagare">
          <MottagarePanel mottagare={db.mottagare} />
        </TabsContent>
        <TabsContent value="kategorier">
          <KategorierPanel kategorier={db.kategorier} arenden={db.arenden} />
        </TabsContent>
        <TabsContent value="standardsvar">
          <StandardsvarPanel standardsvar={db.standardsvar} />
        </TabsContent>
        <TabsContent value="system">
          <SystemPanel />
        </TabsContent>
      </Tabs>
    </Sida>
  )
}
