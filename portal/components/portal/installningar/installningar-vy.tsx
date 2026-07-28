'use client'

import { BellIcon, MailIcon, MessageSquareTextIcon, ServerIcon, TagsIcon } from 'lucide-react'
import { useState } from 'react'

import { AviseringarPanel } from '@/components/portal/installningar/aviseringar-panel'
import { KategorierPanel } from '@/components/portal/installningar/kategorier-panel'
import { MottagarePanel } from '@/components/portal/installningar/mottagare-panel'
import { StandardsvarPanel } from '@/components/portal/installningar/standardsvar-panel'
import { SystemPanel } from '@/components/portal/installningar/system-panel'
import { Sida, Sidhuvud } from '@/components/portal/ui-delar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  adminAviseringarUnderlag,
  adminKategorierUnderlag,
  adminMottagareUnderlag,
  adminStandardsvarUnderlag,
} from '@/lib/admin/installnings-underlag'

type Flik = 'system' | 'aviseringar' | 'mottagare' | 'kategorier' | 'standardsvar'

/**
 * Inställningsmodulen. Samlar de systemval som tidigare bara fanns i datalagret
 * men aldrig hade någon vy: aviseringar, e-postmottagare, ärendekategorier,
 * standardsvar och systemöversikt.
 *
 * Systemfliken är verkligt kopplad mot Supabase/Cloudflare och renderas utan
 * beroende till demolagret. Övriga flikar visas som låst underlag tills de får
 * serverlagring och e-postflöde.
 */
export function InstallningarVy() {
  const [flik, setFlik] = useState<Flik>('system')

  return (
    <Sida>
      <Sidhuvud
        rubrik="Inställningar"
        beskrivning="Systemfliken är kopplad mot Supabase och Cloudflare Worker. Övriga konfigurationsflikar visas som underlag tills backendtabeller och e-postflöde är beslutade."
      />

      <Tabs value={flik} onValueChange={(v) => setFlik(v as Flik)}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="system">
            <ServerIcon data-icon="inline-start" />
            System
          </TabsTrigger>
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
        </TabsList>

        <TabsContent value="system">
          <SystemPanel />
        </TabsContent>
        <TabsContent value="aviseringar">
          <AviseringarPanel aviseringar={adminAviseringarUnderlag} />
        </TabsContent>
        <TabsContent value="mottagare">
          <MottagarePanel mottagare={adminMottagareUnderlag} />
        </TabsContent>
        <TabsContent value="kategorier">
          <KategorierPanel kategorier={adminKategorierUnderlag} />
        </TabsContent>
        <TabsContent value="standardsvar">
          <StandardsvarPanel standardsvar={adminStandardsvarUnderlag} />
        </TabsContent>
      </Tabs>
    </Sida>
  )
}
