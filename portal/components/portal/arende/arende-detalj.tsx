'use client'

import {
  ArrowLeftIcon,
  BuildingIcon,
  CalendarClockIcon,
  CalendarPlusIcon,
  DownloadIcon,
  FileTextIcon,
  MailIcon,
  MapPinIcon,
  PaperclipIcon,
  PencilIcon,
  PhoneIcon,
  SearchXIcon,
  SparklesIcon,
  Trash2Icon,
  UserRoundIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { ArendeAtgarder } from '@/components/portal/arende/arende-atgarder'
import { Konversation } from '@/components/portal/arende/konversation'
import { Tidslinje } from '@/components/portal/arende/tidslinje'
import { BokningDialog } from '@/components/portal/bokningar/bokning-dialog'
import {
  BokningStatusChip,
  Faltrad,
  KopieraKnapp,
  KundtypChip,
  Sektionsrubrik,
  Sida,
  Yta,
} from '@/components/portal/ui-delar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useDemoData } from '@/hooks/use-demo-data'
import { anvandarNamn } from '@/lib/auth/demo-auth'
import {
  bokningTypLabel,
  formateraDatum,
  formateraDatumTid,
  formateraVeckodag,
  kanalLabel,
  kategoriLabel,
  relativTid,
} from '@/lib/labels'
import { avbokaBokning } from '@/lib/store'
import type { Bokning } from '@/lib/types'

/**
 * Ärendedetaljsidan – portalens arbetsyta.
 *
 * Vänster kolumn är ärendets innehåll och dialog, höger kolumn är fakta,
 * bilagor, bokningar och händelselogg. All data läses från demodatalagret via
 * `useDemoData`, som uppdateras automatiskt efter varje skrivning.
 */
export function ArendeDetalj({ arendeId }: { arendeId: string }) {
  const { db, laddar } = useDemoData()
  const { anvandare, kan } = useAuth()
  const [bokningOppen, setBokningOppen] = useState(false)
  const [redigeraBokning, setRedigeraBokning] = useState<Bokning | undefined>(undefined)

  const arende = db?.arenden.find((a) => a.id === arendeId)
  const kund = arende ? db?.kunder.find((k) => k.id === arende.kundId) : undefined

  const meddelanden = useMemo(() => {
    if (!db) return []
    return db.meddelanden
      .filter((m) => m.arendeId === arendeId)
      .sort((a, b) => +new Date(a.tidpunkt) - +new Date(b.tidpunkt))
  }, [db, arendeId])

  const aktiviteter = useMemo(() => {
    if (!db) return []
    return db.aktiviteter
      .filter((a) => a.arendeId === arendeId)
      .sort((a, b) => +new Date(b.tidpunkt) - +new Date(a.tidpunkt))
  }, [db, arendeId])

  const bokningar = useMemo(() => {
    if (!db) return []
    return db.bokningar
      .filter((b) => b.arendeId === arendeId)
      .sort((a, b) => `${a.datum}${a.tid}`.localeCompare(`${b.datum}${b.tid}`))
  }, [db, arendeId])

  if (laddar || !db) return <DetaljSkelett />

  if (!arende) {
    return (
      <Sida>
        <Empty className="bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>Ärendet hittades inte</EmptyTitle>
            <EmptyDescription>
              Ärendet kan ha tagits bort, eller så har demodatan återställts i den här sessionen.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" size="sm" render={<Link href="/portal/arenden" />}>
            <ArrowLeftIcon data-icon="inline-start" />
            Tillbaka till ärendelistan
          </Button>
        </Empty>
      </Sida>
    )
  }

  const kunduppgifter = [
    arende.kundNamn,
    arende.organisation,
    arende.epost,
    arende.telefon,
    kund ? `${kund.adress}, ${kund.ort}` : undefined,
  ]
    .filter(Boolean)
    .join('\n')

  async function avboka(bokning: Bokning) {
    await avbokaBokning(bokning.id, anvandare?.namn ?? 'Okänd')
    toast.success('Bokningen avbokades', { description: 'Kunden aviseras inte i demoläget.' })
  }

  return (
    <Sida bred className="lg:py-6">
      {/* Sidhuvud med ärendenummer och navigering tillbaka */}
      <div className="flex flex-col gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit text-muted-foreground"
          render={<Link href="/portal/arenden" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Alla ärenden
        </Button>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-tabular font-mono text-[12px] text-muted-foreground">
              {arende.arendenummer}
            </span>
            <KopieraKnapp varde={arende.arendenummer} etikett="Ärendenummer" />
            <span className="text-[12px] text-muted-foreground" aria-hidden>
              ·
            </span>
            <span className="text-[12px] text-muted-foreground">
              {kanalLabel[arende.kanal]} · inkom {formateraDatumTid(arende.skapad)}
            </span>
          </div>
          <h1 className="text-pretty text-xl font-semibold leading-tight sm:text-[1.5rem]">
            {arende.rubrik}
          </h1>
          <p className="text-[12px] text-muted-foreground">
            Uppdaterades {relativTid(arende.uppdaterad)}
            {arende.sistaSvar && ` · senaste svar till kund ${relativTid(arende.sistaSvar)}`}
          </p>
        </div>
      </div>

      {/* Åtgärdsrad */}
      <Yta className="p-3" niva={1}>
        <ArendeAtgarder
          arende={arende}
          vidBoka={() => {
            setRedigeraBokning(undefined)
            setBokningOppen(true)
          }}
        />
      </Yta>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Vänster: innehåll och dialog */}
        <div className="flex flex-col gap-4">
          <Yta className="flex flex-col gap-3 p-4">
            <Sektionsrubrik>Kundens beskrivning</Sektionsrubrik>
            <p className="whitespace-pre-wrap text-pretty text-[13px] leading-relaxed text-text-secondary">
              {arende.beskrivning}
            </p>
          </Yta>

          {arende.assistentSammanfattning && (
            <Yta className="flex flex-col gap-3 p-4">
              <Sektionsrubrik>Sammanfattning från supportassistenten</Sektionsrubrik>
              <div className="flex gap-3 rounded-lg bg-info/8 p-3">
                <SparklesIcon className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
                <p className="text-pretty text-[13px] leading-relaxed text-text-secondary">
                  {arende.assistentSammanfattning}
                </p>
              </div>
            </Yta>
          )}

          <Yta className="p-4">
            <Konversation
              arendeId={arende.id}
              meddelanden={meddelanden}
              standardsvar={db.standardsvar}
            />
          </Yta>
        </div>

        {/* Höger: fakta, bilagor, bokningar, händelser */}
        <div className="flex flex-col gap-4">
          <Yta className="flex flex-col gap-3.5 p-4">
            <Sektionsrubrik
              atgard={
                <KopieraKnapp varde={kunduppgifter} etikett="Kunduppgifter" variant="ghost" storlek="sm">
                  Kopiera
                </KopieraKnapp>
              }
            >
              Kund
            </Sektionsrubrik>

            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                {arende.kundtyp === 'verksamhet' ? (
                  <BuildingIcon className="size-4" aria-hidden />
                ) : (
                  <UserRoundIcon className="size-4" aria-hidden />
                )}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-[13px] font-medium">{arende.kundNamn}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <KundtypChip kundtyp={arende.kundtyp} />
                  {arende.organisation && (
                    <span className="truncate text-[11px] text-muted-foreground">
                      {arende.organisation}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <dl className="flex flex-col gap-3">
              <Faltrad etikett="E-post">
                <span className="flex items-center gap-1.5">
                  <MailIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <a
                    href={`mailto:${arende.epost}`}
                    className="truncate transition-colors hover:text-primary"
                  >
                    {arende.epost}
                  </a>
                  <KopieraKnapp varde={arende.epost} etikett="E-postadress" />
                </span>
              </Faltrad>
              <Faltrad etikett="Telefon">
                <span className="flex items-center gap-1.5">
                  <PhoneIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <a
                    href={`tel:${arende.telefon.replace(/\s/g, '')}`}
                    className="transition-colors hover:text-primary"
                  >
                    {arende.telefon}
                  </a>
                  <KopieraKnapp varde={arende.telefon} etikett="Telefonnummer" />
                </span>
              </Faltrad>
              {kund && (
                <Faltrad etikett="Adress">
                  <span className="flex items-start gap-1.5">
                    <MapPinIcon
                      className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    {kund.adress}, {kund.ort}
                  </span>
                </Faltrad>
              )}
            </dl>

            {kan('se_kunder') && kund && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                render={<Link href={`/portal/kunder/${kund.id}`} />}
              >
                Öppna kundprofil
              </Button>
            )}
          </Yta>

          <Yta className="flex flex-col gap-3.5 p-4">
            <Sektionsrubrik>Ärendefakta</Sektionsrubrik>
            <dl className="grid grid-cols-2 gap-3.5">
              <Faltrad etikett="Kategori">{kategoriLabel[arende.kategori]}</Faltrad>
              <Faltrad etikett="Underkategori">{arende.underkategori}</Faltrad>
              <Faltrad etikett="Ansvarig">
                <span className={arende.ansvarigId ? undefined : 'text-muted-foreground'}>
                  {anvandarNamn(arende.ansvarigId)}
                </span>
              </Faltrad>
              <Faltrad etikett="Inkom via">{kanalLabel[arende.kanal]}</Faltrad>
              <Faltrad etikett="Skapat">{formateraDatum(arende.skapad)}</Faltrad>
              <Faltrad etikett="Senast uppdaterat">{relativTid(arende.uppdaterad)}</Faltrad>
            </dl>
          </Yta>

          <Yta className="flex flex-col gap-3 p-4">
            <Sektionsrubrik antal={arende.bilagor.length}>Bifogade filer</Sektionsrubrik>
            {arende.bilagor.length === 0 ? (
              <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <PaperclipIcon className="size-3.5 shrink-0" aria-hidden />
                Inga filer bifogade.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {arende.bilagor.map((bilaga) => (
                  <li
                    key={bilaga.id}
                    className="flex items-center gap-2.5 rounded-lg bg-surface-emphasis px-3 py-2.5"
                  >
                    <FileTextIcon
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[13px]">{bilaga.namn}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {bilaga.storlek} · {relativTid(bilaga.uppladdad)}
                      </span>
                    </span>
                    {/* Filhantering är attrapp i demon – ingen riktig lagring finns. */}
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" aria-label="Ladda ner filen" disabled>
                            <DownloadIcon />
                          </Button>
                        }
                      />
                      <TooltipContent>Filhämtning saknas i demoläget</TooltipContent>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            )}
          </Yta>

          <Yta className="flex flex-col gap-3 p-4">
            <Sektionsrubrik
              antal={bokningar.length}
              atgard={
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!kan('hantera_bokningar')}
                  onClick={() => {
                    setRedigeraBokning(undefined)
                    setBokningOppen(true)
                  }}
                >
                  <CalendarPlusIcon data-icon="inline-start" />
                  Ny tid
                </Button>
              }
            >
              Bokningar
            </Sektionsrubrik>

            {bokningar.length === 0 ? (
              <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <CalendarClockIcon className="size-3.5 shrink-0" aria-hidden />
                Ingen tid är bokad för ärendet.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {bokningar.map((bokning) => (
                  <li
                    key={bokning.id}
                    className="flex flex-col gap-2 rounded-lg bg-surface-emphasis p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium">
                        {formateraVeckodag(bokning.datum)} kl. {bokning.tid}
                      </span>
                      <BokningStatusChip status={bokning.status} />
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {bokningTypLabel[bokning.typ]} · {bokning.langdMinuter} min ·{' '}
                      {anvandarNamn(bokning.tekniker)}
                      <br />
                      {bokning.plats}
                    </p>
                    {bokning.notering && (
                      <p className="text-pretty text-[12px] leading-relaxed text-text-secondary">
                        {bokning.notering}
                      </p>
                    )}
                    {bokning.status !== 'avbokad' && bokning.status !== 'genomford' && (
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!kan('hantera_bokningar')}
                          onClick={() => {
                            setRedigeraBokning(bokning)
                            setBokningOppen(true)
                          }}
                        >
                          <PencilIcon data-icon="inline-start" />
                          Ändra
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!kan('hantera_bokningar')}
                                className="text-destructive"
                              >
                                <Trash2Icon data-icon="inline-start" />
                                Avboka
                              </Button>
                            }
                          />
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogMedia>
                                <Trash2Icon className="text-destructive" />
                              </AlertDialogMedia>
                              <AlertDialogTitle>Avboka tiden?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {`Bokningen ${formateraVeckodag(bokning.datum)} kl. ${bokning.tid} markeras som avbokad och ärendet återgår till pågående.`}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Behåll bokningen</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => avboka(bokning)}
                              >
                                Avboka
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Yta>

          <Yta className="p-4">
            <Tidslinje aktiviteter={aktiviteter} />
          </Yta>
        </div>
      </div>

      <BokningDialog
        oppen={bokningOppen}
        setOppen={setBokningOppen}
        befintlig={redigeraBokning}
        arende={arende}
        kunder={db.kunder}
      />
    </Sida>
  )
}

function DetaljSkelett() {
  return (
    <Sida bred>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-2/3 max-w-md" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </Sida>
  )
}
