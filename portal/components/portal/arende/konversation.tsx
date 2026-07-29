'use client'

import {
  BotIcon,
  LockIcon,
  MessageSquareIcon,
  SendIcon,
  StickyNoteIcon,
  UserIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { Sektionsrubrik } from '@/components/portal/ui-delar'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { formateraDatumTid } from '@/lib/labels'
import { laggTillMeddelande } from '@/lib/store'
import type { Meddelande, Standardsvar } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Ärendets konversation samt svarsrutan. Ett externt svar går till kunden,
 * en intern anteckning stannar i portalen. Skillnaden markeras tydligt både
 * i listan och i skrivläget – det är den vanligaste felkällan i supportverktyg.
 */
export function Konversation({
  arendeId,
  meddelanden,
  standardsvar,
}: {
  arendeId: string
  meddelanden: Meddelande[]
  standardsvar: Standardsvar[]
}) {
  const { anvandare, kan } = useAuth()
  const [lage, setLage] = useState<'svar' | 'anteckning'>('svar')
  const [text, setText] = useState('')
  const [skickar, setSkickar] = useState(false)
  const [utkastSparat, setUtkastSparat] = useState(false)
  const [utkastLaddatForNyckel, setUtkastLaddatForNyckel] = useState('')

  const kanSvara = kan('svara_kund')
  const internt = lage === 'anteckning'
  const utkastNyckel = `nova-it.arende-utkast:${arendeId}:${lage}`

  useEffect(() => {
    const sparat = window.sessionStorage.getItem(utkastNyckel)
    setText(sparat ?? '')
    setUtkastSparat(Boolean(sparat))
    setUtkastLaddatForNyckel(utkastNyckel)
  }, [utkastNyckel])

  useEffect(() => {
    if (utkastLaddatForNyckel !== utkastNyckel) return
    if (!text) {
      window.sessionStorage.removeItem(utkastNyckel)
      setUtkastSparat(false)
      return
    }
    const timeout = window.setTimeout(() => {
      window.sessionStorage.setItem(utkastNyckel, text)
      setUtkastSparat(true)
    }, 750)
    return () => window.clearTimeout(timeout)
  }, [text, utkastLaddatForNyckel, utkastNyckel])

  async function skicka() {
    const rensad = text.trim()
    if (!rensad || skickar) return
    setSkickar(true)
    try {
      await laggTillMeddelande(arendeId, rensad, internt, anvandare?.namn ?? 'Okänd')
      setText('')
      window.sessionStorage.removeItem(utkastNyckel)
      setUtkastSparat(false)
      toast.success(internt ? 'Intern anteckning sparad' : 'Svaret är skickat', {
        description: internt
          ? 'Anteckningen visas aldrig för kunden.'
          : 'Kunden får inget automatiskt e-postmeddelande ännu.',
      })
    } catch (error) {
      toast.error(internt ? 'Kunde inte spara anteckningen' : 'Kunde inte skicka svaret', {
        description: error instanceof Error ? error.message : 'Försök igen.',
      })
    } finally {
      setSkickar(false)
    }
  }

  function anvandStandardsvar(svarId: string) {
    const svar = standardsvar.find((s) => s.id === svarId)
    if (!svar) return
    setLage('svar')
    setText((tidigare) => (tidigare.trim() ? `${tidigare.trim()}\n\n${svar.text}` : svar.text))
  }

  return (
    <section className="flex flex-col gap-3">
      <Sektionsrubrik antal={meddelanden.length}>Konversation</Sektionsrubrik>

      {meddelanden.length === 0 ? (
        <Empty className="bg-surface-emphasis py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquareIcon />
            </EmptyMedia>
            <EmptyTitle>Ingen dialog ännu</EmptyTitle>
            <EmptyDescription>
              Skriv det första svaret till kunden eller lägg en intern anteckning.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {meddelanden.map((m) => (
            <MeddelandeBubbla key={m.id} meddelande={m} />
          ))}
        </ol>
      )}

      {/* Svarsruta */}
      <div
        className={cn(
          'flex flex-col gap-3 rounded-xl p-3 transition-colors',
          internt ? 'bg-warning/8' : 'bg-surface-emphasis',
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tabs value={lage} onValueChange={(v) => setLage(v as 'svar' | 'anteckning')}>
            <TabsList>
              <TabsTrigger value="svar">
                <SendIcon data-icon="inline-start" />
                Svara kund
              </TabsTrigger>
              <TabsTrigger value="anteckning">
                <StickyNoteIcon data-icon="inline-start" />
                Intern anteckning
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {!internt && standardsvar.length > 0 && (
            <Select
              items={Object.fromEntries(standardsvar.map((s) => [s.id, s.rubrik]))}
              value=""
              onValueChange={(v) => anvandStandardsvar(String(v))}
            >
              <SelectTrigger size="sm" className="w-[210px] bg-card">
                <SelectValue placeholder="Använd standardsvar">
                  {() => 'Använd standardsvar'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="min-w-[280px]">
                {standardsvar.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex flex-col items-start gap-0.5">
                      <span>{s.rubrik}</span>
                      <span className="text-[11px] text-muted-foreground">{s.kategori}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {utkastSparat && <span className="text-[11px] text-muted-foreground">Utkast autosparat</span>}
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          disabled={!kanSvara}
          className="resize-y bg-card"
          placeholder={
            kanSvara
              ? internt
                ? 'Anteckning till kollegorna – syns aldrig för kunden…'
                : 'Skriv ditt svar till kunden…'
              : 'Din roll kan inte svara kunder.'
          }
          aria-label={internt ? 'Intern anteckning' : 'Svar till kund'}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            {internt ? (
              <>
                <LockIcon className="size-3.5 shrink-0" />
                Endast synlig internt
              </>
            ) : (
              <>
                <SendIcon className="size-3.5 shrink-0" />
                Skickas till {'kundens e-postadress'}
              </>
            )}
          </p>
          <Button size="sm" onClick={skicka} disabled={!kanSvara || skickar || !text.trim()}>
            {skickar && <Spinner data-icon="inline-start" />}
            {internt ? 'Spara anteckning' : 'Skicka svar'}
          </Button>
        </div>
      </div>
    </section>
  )
}

function MeddelandeBubbla({ meddelande }: { meddelande: Meddelande }) {
  const franKund = meddelande.avsandare === 'kund'
  const franAssistent = meddelande.avsandare === 'assistent'
  const Ikon = franKund ? UserIcon : franAssistent ? BotIcon : SendIcon

  return (
    <li
      className={cn(
        'flex flex-col gap-1.5 rounded-xl p-3',
        meddelande.internt
          ? 'bg-warning/8'
          : franKund
            ? 'bg-surface-emphasis'
            : franAssistent
              ? 'bg-info/8'
              : 'bg-primary/8',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-[13px] font-medium">
          <Ikon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          {meddelande.avsandareNamn}
        </span>
        {meddelande.internt && (
          <span className="inline-flex items-center gap-1 rounded-md bg-warning/16 px-1.5 py-0.5 text-[11px] font-medium leading-5 text-warning">
            <LockIcon className="size-3" aria-hidden />
            Intern
          </span>
        )}
        {franAssistent && (
          <span className="rounded-md bg-info/16 px-1.5 py-0.5 text-[11px] font-medium leading-5 text-info">
            Supportassistent
          </span>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground">
          {formateraDatumTid(meddelande.tidpunkt)}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-pretty text-[13px] leading-relaxed text-text-secondary">
        {meddelande.text}
      </p>
    </li>
  )
}
