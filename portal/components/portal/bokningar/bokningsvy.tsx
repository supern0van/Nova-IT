'use client'

import {
  CalendarPlusIcon,
  CalendarRangeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeadphonesIcon,
  MonitorSmartphoneIcon,
  PencilIcon,
  PhoneIcon,
  TicketIcon,
  Trash2Icon,
  TriangleAlertIcon,
  WrenchIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { BokningDialog } from '@/components/portal/bokningar/bokning-dialog'
import { FilterVal } from '@/components/portal/filter-val'
import {
  BokningStatusChip,
  DriftFelBanner,
  Sektionsrubrik,
  Sida,
  Sidhuvud,
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
import { Spinner } from '@/components/ui/spinner'
import { useOperativAdminData } from '@/hooks/use-operativ-admin-data'
import { bokningStatusLabel, bokningTypLabel } from '@/lib/labels'
import { personalNamn, tilldelningsbarPersonal } from '@/lib/personal'
import { avbokaBokning, bokningTyper } from '@/lib/store'
import type { Anvandare, Bokning, BokningTyp } from '@/lib/types'
import { cn } from '@/lib/utils'

const typIkon: Record<BokningTyp, typeof PhoneIcon> = {
  hembesok: MonitorSmartphoneIcon,
  distanssupport: HeadphonesIcon,
  verkstadsbesok: WrenchIcon,
  telefonkontakt: PhoneIcon,
}

/** ISO-datum (YYYY-MM-DD) utan tidszonsförskjutning. */
function isoDatum(d: Date) {
  const kopia = new Date(d)
  kopia.setMinutes(kopia.getMinutes() - kopia.getTimezoneOffset())
  return kopia.toISOString().slice(0, 10)
}

/** Måndagen i veckan som datumet tillhör. */
function veckostart(d: Date) {
  const kopia = new Date(d)
  const veckodag = (kopia.getDay() + 6) % 7
  kopia.setDate(kopia.getDate() - veckodag)
  kopia.setHours(0, 0, 0, 0)
  return kopia
}

function veckonummer(d: Date) {
  const mål = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const veckodag = (mål.getUTCDay() + 6) % 7
  mål.setUTCDate(mål.getUTCDate() - veckodag + 3)
  const förstaTorsdag = new Date(Date.UTC(mål.getUTCFullYear(), 0, 4))
  const förstaVeckodag = (förstaTorsdag.getUTCDay() + 6) % 7
  förstaTorsdag.setUTCDate(förstaTorsdag.getUTCDate() - förstaVeckodag + 3)
  return 1 + Math.round((mål.getTime() - förstaTorsdag.getTime()) / (7 * 86400_000))
}

/**
 * Bokningsvyn – en veckoagenda där varje dag är en egen sektion.
 * Kalenderkänsla utan tunga rutnät, vilket fungerar bättre på små skärmar.
 */
export function Bokningsvy() {
  const { db, laddar, fel, uppdatera } = useOperativAdminData()
  const { anvandare, kan } = useAuth()
  const params = useSearchParams()

  const [veckoStart, setVeckoStart] = useState(() => veckostart(new Date()))
  const [typ, setTyp] = useState('alla')
  const [tekniker, setTekniker] = useState('alla')
  const [dialogOppen, setDialogOppen] = useState(false)
  const [redigerad, setRedigerad] = useState<Bokning | undefined>(undefined)
  const [avbokarId, setAvbokarId] = useState<string | null>(null)

  const kanHantera = kan('hantera_bokningar')

  // Genväg från översikten: /portal/bokningar?ny=1 öppnar dialogen direkt.
  useEffect(() => {
    if (params.get('ny') === '1' && kanHantera) setDialogOppen(true)
  }, [params, kanHantera])

  const dagar = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(veckoStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [veckoStart])

  const filtrerade = useMemo(() => {
    if (!db) return []
    return db.bokningar.filter((b) => {
      if (typ !== 'alla' && b.typ !== typ) return false
      if (tekniker !== 'alla' && b.tekniker !== tekniker) return false
      return true
    })
  }, [db, typ, tekniker])

  const iDag = isoDatum(new Date())
  const veckansDatum = dagar.map(isoDatum)
  const iVeckan = filtrerade.filter((b) => veckansDatum.includes(b.datum))

  const kommande = useMemo(
    () =>
      filtrerade
        .filter((b) => b.datum >= iDag && b.status !== 'avbokad' && !veckansDatum.includes(b.datum))
        .sort((a, b) => `${a.datum}${a.tid}`.localeCompare(`${b.datum}${b.tid}`))
        .slice(0, 5),
    [filtrerade, iDag, veckansDatum],
  )

  const tilldelningsbar = useMemo(() => tilldelningsbarPersonal(db?.personal ?? []), [db])
  const veckoEtikett = `Vecka ${veckonummer(veckoStart)} · ${dagar[0].toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}–${dagar[6].toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })}`

  function flyttaVecka(steg: number) {
    const ny = new Date(veckoStart)
    ny.setDate(ny.getDate() + steg * 7)
    setVeckoStart(veckostart(ny))
  }

  async function avboka(bokning: Bokning) {
    if (avbokarId) return
    setAvbokarId(bokning.id)
    try {
      await avbokaBokning(bokning.id, anvandare?.namn ?? 'Okänd')
      toast.success('Bokningen avbokades', { description: 'Kunden meddelas inte automatiskt ännu.' })
    } catch (error) {
      toast.error('Kunde inte avboka bokningen', {
        description: error instanceof Error ? error.message : 'Försök igen.',
      })
    } finally {
      setAvbokarId(null)
    }
  }

  function oppnaNy() {
    setRedigerad(undefined)
    setDialogOppen(true)
  }

  function oppnaAndra(bokning: Bokning) {
    setRedigerad(bokning)
    setDialogOppen(true)
  }

  return (
    <Sida bred>
      <Sidhuvud
        rubrik="Bokningar"
        beskrivning="Hembesök, distanssupport, verkstadsbesök och telefontider – vecka för vecka."
      >
        <Button size="sm" onClick={oppnaNy} disabled={!kanHantera}>
          <CalendarPlusIcon data-icon="inline-start" />
          Ny bokning
        </Button>
      </Sidhuvud>

      {fel && <DriftFelBanner vidForsokIgen={uppdatera} />}

      <Yta className="flex flex-col gap-4 p-3.5">
        {/* Veckonavigering och filter */}
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => flyttaVecka(-1)}
              aria-label="Föregående vecka"
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => flyttaVecka(1)}
              aria-label="Nästa vecka"
            >
              <ChevronRightIcon />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVeckoStart(veckostart(new Date()))}
            >
              Denna vecka
            </Button>
            <p className="text-[13px] font-medium">{veckoEtikett}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterVal
              etikett="Typ"
              varde={typ}
              vidAndring={setTyp}
              bredd="w-[190px]"
              alternativ={[
                { varde: 'alla', etikett: 'Alla besökstyper' },
                ...bokningTyper.map((t) => ({ varde: t, etikett: bokningTypLabel[t] })),
              ]}
            />
            <FilterVal
              etikett="Tekniker"
              varde={tekniker}
              vidAndring={setTekniker}
              bredd="w-[190px]"
              alternativ={[
                { varde: 'alla', etikett: 'Alla tekniker' },
                ...tilldelningsbar.map((p) => ({
                  varde: p.id,
                  etikett: p.id === anvandare?.id ? `${p.namn} (jag)` : p.namn,
                })),
              ]}
            />
          </div>
        </div>

        {laddar ? (
          <div className="grid gap-2 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <p className="text-[12px] text-muted-foreground">
              {iVeckan.filter((b) => b.status !== 'avbokad').length} bokningar den här veckan
            </p>

            <div className="grid gap-2 lg:grid-cols-2 2xl:grid-cols-3">
              {dagar.map((dag) => {
                const datum = isoDatum(dag)
                const dagensBokningar = iVeckan
                  .filter((b) => b.datum === datum)
                  .sort((a, b) => a.tid.localeCompare(b.tid))
                const arIdag = datum === iDag

                return (
                  <section
                    key={datum}
                    className={cn(
                      'flex flex-col gap-2 rounded-xl p-3',
                      arIdag ? 'bg-primary/8' : 'bg-surface-emphasis',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="flex items-center gap-2 text-[13px] font-semibold capitalize">
                        {dag.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' })}
                        {arIdag && (
                          <span className="rounded-md bg-primary/16 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                            Idag
                          </span>
                        )}
                      </h2>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={oppnaNy}
                        disabled={!kanHantera}
                        aria-label={`Boka tid ${dag.toLocaleDateString('sv-SE')}`}
                      >
                        <CalendarPlusIcon />
                      </Button>
                    </div>

                    {dagensBokningar.length === 0 ? (
                      <p className="py-2 text-[12px] text-muted-foreground">Inga bokningar.</p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {dagensBokningar.map((bokning) => (
                          <BokningRad
                            key={bokning.id}
                            bokning={bokning}
                            personal={db?.personal ?? []}
                            kanHantera={kanHantera}
                            avbokas={avbokarId === bokning.id}
                            avbokningPagar={avbokarId !== null}
                            vidAndra={() => oppnaAndra(bokning)}
                            vidAvboka={() => avboka(bokning)}
                          />
                        ))}
                      </ul>
                    )}
                  </section>
                )
              })}
            </div>
          </>
        )}
      </Yta>

      {/* Kommande utanför den valda veckan – så att inget missas. */}
      {!laddar && kommande.length > 0 && (
        <Yta className="flex flex-col gap-3 p-4">
          <Sektionsrubrik antal={kommande.length}>Längre fram</Sektionsrubrik>
          <ul className="flex flex-col gap-1.5">
            {kommande.map((bokning) => {
              const Ikon = typIkon[bokning.typ]
              return (
                <li
                  key={bokning.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-emphasis px-3 py-2.5"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                    <Ikon className="size-3.5" aria-hidden />
                  </span>
                  <span className="text-[13px] font-medium capitalize">
                    {new Date(bokning.datum).toLocaleDateString('sv-SE', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    kl. {bokning.tid}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px]">{bokning.kundNamn}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {bokningTypLabel[bokning.typ]} · {personalNamn(db?.personal ?? [], bokning.tekniker)}
                  </span>
                  <BokningStatusChip status={bokning.status} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => oppnaAndra(bokning)}
                    disabled={!kanHantera}
                  >
                    <PencilIcon data-icon="inline-start" />
                    Ändra
                  </Button>
                </li>
              )
            })}
          </ul>
        </Yta>
      )}

      {!laddar && iVeckan.length === 0 && kommande.length === 0 && fel && (
        <Empty className="bg-card py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TriangleAlertIcon />
            </EmptyMedia>
            <EmptyTitle>Kan inte visa bokningar just nu</EmptyTitle>
            <EmptyDescription>
              Listan kunde inte hämtas från servern – se felmeddelandet ovan och försök igen.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {!laddar && iVeckan.length === 0 && kommande.length === 0 && !fel && (
        <Empty className="bg-card py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarRangeIcon />
            </EmptyMedia>
            <EmptyTitle>Inga bokningar i urvalet</EmptyTitle>
            <EmptyDescription>
              Byt vecka eller nollställ filtren – eller lägg upp en ny tid direkt.
            </EmptyDescription>
          </EmptyHeader>
          <Button size="sm" onClick={oppnaNy} disabled={!kanHantera}>
            <CalendarPlusIcon data-icon="inline-start" />
            Ny bokning
          </Button>
        </Empty>
      )}

      <BokningDialog
        oppen={dialogOppen}
        setOppen={setDialogOppen}
        befintlig={redigerad}
        kunder={db?.kunder ?? []}
        personal={db?.personal ?? []}
      />
    </Sida>
  )
}

function BokningRad({
  bokning,
  personal,
  kanHantera,
  avbokas,
  avbokningPagar,
  vidAndra,
  vidAvboka,
}: {
  bokning: Bokning
  personal: Anvandare[]
  kanHantera: boolean
  avbokas: boolean
  avbokningPagar: boolean
  vidAndra: () => void
  vidAvboka: () => void
}) {
  const Ikon = typIkon[bokning.typ]
  const avbokad = bokning.status === 'avbokad'

  return (
    <li
      className={cn(
        'flex flex-col gap-2 rounded-lg bg-card p-2.5',
        avbokad && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-tabular mt-0.5 shrink-0 text-[13px] font-semibold">
          {bokning.tid}
        </span>
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary">
          <Ikon className="size-3.5" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className={cn('truncate text-[13px] font-medium', avbokad && 'line-through')}>
            {bokning.kundNamn}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {bokningTypLabel[bokning.typ]} · {bokning.langdMinuter} min ·{' '}
            {personalNamn(personal, bokning.tekniker)}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">{bokning.plats}</span>
        </div>
        <BokningStatusChip status={bokning.status} />
      </div>

      {bokning.notering && (
        <p className="text-pretty text-[12px] leading-relaxed text-text-secondary">
          {bokning.notering}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {bokning.arendeId && (
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/portal/arenden/${bokning.arendeId}`} />}
          >
            <TicketIcon data-icon="inline-start" />
            {bokning.arendenummer ?? 'Ärende'}
          </Button>
        )}
        {!avbokad && (
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={vidAndra} disabled={!kanHantera}>
              <PencilIcon data-icon="inline-start" />
              Ändra
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={!kanHantera || avbokningPagar}
                  >
                    {avbokas ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <Trash2Icon data-icon="inline-start" />
                    )}
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
                    {`${bokning.kundNamn} kl. ${bokning.tid} markeras som ${bokningStatusLabel.avbokad.toLowerCase()}. Ingen avisering skickas till kunden ännu.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Behåll bokningen</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={vidAvboka}>
                    Avboka
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </li>
  )
}
