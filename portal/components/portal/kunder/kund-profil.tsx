'use client'

import {
  ArrowLeftIcon,
  BuildingIcon,
  CalendarPlusIcon,
  CheckCircle2Icon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  SearchXIcon,
  Trash2Icon,
  TicketIcon,
  TriangleAlertIcon,
  UserRoundIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { ArendeDialog } from '@/components/portal/arenden/arende-dialog'
import { BokningDialog } from '@/components/portal/bokningar/bokning-dialog'
import { KundAnteckningar } from '@/components/portal/kunder/kund-anteckningar'
import { KundDialog } from '@/components/portal/kunder/kund-dialog'
import {
  BokningStatusChip,
  DriftFelBanner,
  Faltrad,
  KopieraKnapp,
  KundtypChip,
  PrioritetChip,
  Sektionsrubrik,
  Sida,
  StatusChip,
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
import { useOperativAdminData } from '@/hooks/use-operativ-admin-data'
import { taBortKund } from '@/lib/store'
import { personalNamn } from '@/lib/personal'
import {
  bokningTypLabel,
  formateraDatum,
  formateraVeckodag,
  kategoriLabel,
  relativTid,
} from '@/lib/labels'
import type { Anvandare, Arende } from '@/lib/types'

const OPPNA: Arende['status'][] = ['ny', 'pagaende', 'vantar_pa_kund', 'bokad']

/**
 * Kundprofil: kontaktuppgifter, ärendehistorik, kommande bokningar och
 * interna anteckningar. Anteckningarna sparas via portalens operativa adminlager och är
 * skrivskyddade för roller utan behörigheten `redigera_kund`.
 */
export function KundProfil({ kundId }: { kundId: string }) {
  const { db, laddar, fel, uppdatera } = useOperativAdminData()
  const { kan } = useAuth()
  const router = useRouter()
  const [bokningOppen, setBokningOppen] = useState(false)
  const [redigeraOppen, setRedigeraOppen] = useState(false)
  const [nyttArendeOppen, setNyttArendeOppen] = useState(false)
  const [tarBort, setTarBort] = useState(false)

  const kund = db?.kunder.find((k) => k.id === kundId)

  // Nyast först, så den senaste noteringen syns direkt.
  const anteckningar = useMemo(() => {
    if (!db) return []
    return db.kundanteckningar
      .filter((a) => a.kundId === kundId)
      .sort((a, b) => +new Date(b.skapad) - +new Date(a.skapad))
  }, [db, kundId])

  const arenden = useMemo(() => {
    if (!db) return { oppna: [] as Arende[], avslutade: [] as Arende[] }
    const alla = db.arenden
      .filter((a) => a.kundId === kundId)
      .sort((a, b) => +new Date(b.uppdaterad) - +new Date(a.uppdaterad))
    return {
      oppna: alla.filter((a) => OPPNA.includes(a.status)),
      avslutade: alla.filter((a) => !OPPNA.includes(a.status)),
    }
  }, [db, kundId])

  const bokningar = useMemo(() => {
    if (!db) return []
    return db.bokningar
      .filter((b) => b.kundId === kundId && b.status !== 'avbokad')
      .sort((a, b) => `${b.datum}${b.tid}`.localeCompare(`${a.datum}${a.tid}`))
      .slice(0, 4)
  }, [db, kundId])

  if (laddar || !db) return <ProfilSkelett />

  if (!kund && fel) {
    return (
      <Sida>
        <DriftFelBanner vidForsokIgen={uppdatera} />
        <Empty className="bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TriangleAlertIcon />
            </EmptyMedia>
            <EmptyTitle>Kan inte visa kunden just nu</EmptyTitle>
            <EmptyDescription>
              Kunden kunde inte hämtas från servern – det betyder inte att den är borttagen.
              Se felmeddelandet ovan och försök igen.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Sida>
    )
  }

  if (!kund) {
    return (
      <Sida>
        <Empty className="bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>Kunden hittades inte</EmptyTitle>
            <EmptyDescription>
              Kunden kan ha tagits bort, eller så finns den inte längre.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" size="sm" render={<Link href="/portal/kunder" />}>
            <ArrowLeftIcon data-icon="inline-start" />
            Tillbaka till kundlistan
          </Button>
        </Empty>
      </Sida>
    )
  }

  const kanRedigera = kan('redigera_kund')
  const Ikon = kund.kundtyp === 'verksamhet' ? BuildingIcon : UserRoundIcon

  const kontaktrader = [
    kund.namn,
    kund.organisation,
    kund.kontaktperson ? `Kontakt: ${kund.kontaktperson}` : undefined,
    kund.epost,
    kund.telefon,
    `${kund.adress}, ${kund.ort}`,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <Sida bred>
      {fel && <DriftFelBanner vidForsokIgen={uppdatera} />}

      <div className="flex flex-col gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit text-muted-foreground"
          render={<Link href="/portal/kunder" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Alla kunder
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Ikon className="size-5" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <h1 className="text-pretty text-xl font-semibold leading-tight sm:text-[1.375rem]">
                {kund.namn}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <KundtypChip kundtyp={kund.kundtyp} />
                {kund.organisation && (
                  <span className="text-[12px] text-muted-foreground">{kund.organisation}</span>
                )}
                {kund.orgnummer && (
                  <span className="text-tabular font-mono text-[11px] text-muted-foreground">
                    {kund.orgnummer}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <KopieraKnapp varde={kontaktrader} etikett="Kunduppgifter" variant="outline" storlek="sm">
              Kopiera uppgifter
            </KopieraKnapp>
            <Button
              variant="outline"
              size="sm"
              disabled={!kanRedigera}
              onClick={() => setRedigeraOppen(true)}
            >
              <PencilIcon data-icon="inline-start" />
              Ändra uppgifter
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!kan('skapa_arende')}
              onClick={() => setNyttArendeOppen(true)}
            >
              <PlusIcon data-icon="inline-start" />
              Nytt ärende
            </Button>
            <Button
              size="sm"
              disabled={!kan('hantera_bokningar')}
              onClick={() => setBokningOppen(true)}
            >
              <CalendarPlusIcon data-icon="inline-start" />
              Boka tid
            </Button>
            {kan('ta_bort_kund') && (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button variant="destructive" size="sm" disabled={tarBort}>
                      <Trash2Icon data-icon="inline-start" />
                      Ta bort kund
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive">
                      <Trash2Icon />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Ta bort {kund.namn} permanent?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {arenden.oppna.length > 0
                        ? `Kunden har ${arenden.oppna.length} öppna ärenden som INTE är markerade som lösta. Alla kundens ärenden, bokningar och anteckningar raderas permanent och kan inte återställas.`
                        : 'Alla kundens ärenden, bokningar och anteckningar raderas permanent och kan inte återställas.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        setTarBort(true)
                        try {
                          const resultat = await taBortKund(kund.id)
                          toast.success(`${kund.namn} har tagits bort`)
                          if (resultat.kundportalKontoSparratMisslyckades) {
                            toast.warning('Kundportalskontot kunde inte spärras', {
                              description:
                                'Kunden är borttagen här, men portalinloggningen kunde inte nås. Kontrollera manuellt.',
                            })
                          }
                          router.push('/portal/kunder')
                        } catch (error) {
                          toast.error('Kunde inte ta bort kunden', {
                            description: error instanceof Error ? error.message : undefined,
                          })
                          setTarBort(false)
                        }
                      }}
                    >
                      Ta bort permanent
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        {/* Vänster: uppgifter, bokningar, anteckningar */}
        <div className="flex flex-col gap-4">
          <Yta className="flex flex-col gap-3.5 p-4">
            <Sektionsrubrik>Kontaktuppgifter</Sektionsrubrik>
            <dl className="flex flex-col gap-3">
              <Faltrad etikett="E-post">
                <span className="flex items-center gap-1.5">
                  <MailIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <a
                    href={`mailto:${kund.epost}`}
                    className="truncate transition-colors hover:text-primary"
                  >
                    {kund.epost}
                  </a>
                  <KopieraKnapp varde={kund.epost} etikett="E-postadress" />
                </span>
              </Faltrad>
              <Faltrad etikett="Telefon">
                <span className="flex items-center gap-1.5">
                  <PhoneIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <a
                    href={`tel:${kund.telefon.replace(/\s/g, '')}`}
                    className="transition-colors hover:text-primary"
                  >
                    {kund.telefon}
                  </a>
                  <KopieraKnapp varde={kund.telefon} etikett="Telefonnummer" />
                </span>
              </Faltrad>
              <Faltrad etikett="Adress">
                <span className="flex items-start gap-1.5">
                  <MapPinIcon
                    className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  {kund.adress}, {kund.ort}
                </span>
              </Faltrad>
              {kund.kontaktperson && (
                <Faltrad etikett="Kontaktperson">{kund.kontaktperson}</Faltrad>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Faltrad etikett="Senaste kontakt">{relativTid(kund.senasteKontakt)}</Faltrad>
                <Faltrad etikett="Kund sedan">{formateraDatum(kund.skapad)}</Faltrad>
              </div>
            </dl>
          </Yta>

          <Yta className="flex flex-col gap-3 p-4">
            <Sektionsrubrik antal={bokningar.length}>Bokningar</Sektionsrubrik>
            {bokningar.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">Inga bokningar registrerade.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {bokningar.map((bokning) => (
                  <li
                    key={bokning.id}
                    className="flex flex-col gap-1.5 rounded-lg bg-surface-emphasis p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium">
                        {formateraVeckodag(bokning.datum)} kl. {bokning.tid}
                      </span>
                      <BokningStatusChip status={bokning.status} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {bokningTypLabel[bokning.typ]} · {personalNamn(db.personal, bokning.tekniker)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Yta>

          <Yta className="flex flex-col gap-3 p-4">
            <KundAnteckningar kundId={kund.id} anteckningar={anteckningar} />
          </Yta>
        </div>

        {/* Höger: ärendehistorik */}
        <div className="flex flex-col gap-4">
          <Yta className="flex flex-col gap-3 p-4">
            <Sektionsrubrik antal={arenden.oppna.length}>Pågående ärenden</Sektionsrubrik>
            {arenden.oppna.length === 0 ? (
              <Empty className="bg-surface-emphasis py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CheckCircle2Icon className="text-success" />
                  </EmptyMedia>
                  <EmptyTitle>Inga öppna ärenden</EmptyTitle>
                  <EmptyDescription>Allt som kunden hört av sig om är avslutat.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ArendeRader arenden={arenden.oppna} personal={db.personal} />
            )}
          </Yta>

          <Yta className="flex flex-col gap-3 p-4">
            <Sektionsrubrik antal={arenden.avslutade.length}>Tidigare ärenden</Sektionsrubrik>
            {arenden.avslutade.length === 0 ? (
              <Empty className="bg-surface-emphasis py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <TicketIcon />
                  </EmptyMedia>
                  <EmptyTitle>Ingen historik ännu</EmptyTitle>
                  <EmptyDescription>Avslutade ärenden hamnar här.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ArendeRader arenden={arenden.avslutade} personal={db.personal} />
            )}
          </Yta>
        </div>
      </div>

      <BokningDialog
        oppen={bokningOppen}
        setOppen={setBokningOppen}
        kunder={db.kunder.filter((k) => k.id === kund.id)}
        personal={db.personal}
      />
      <KundDialog oppen={redigeraOppen} setOppen={setRedigeraOppen} befintlig={kund} />
      <ArendeDialog
        oppen={nyttArendeOppen}
        setOppen={setNyttArendeOppen}
        kunder={db.kunder.filter((k) => k.id === kund.id)}
        kategorier={db.kategorier.filter((k) => k.aktiv)}
        forvaldKundId={kund.id}
      />
    </Sida>
  )
}

function ArendeRader({ arenden, personal }: { arenden: Arende[]; personal: Anvandare[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {arenden.map((arende) => (
        <li key={arende.id}>
          <Link
            href={`/portal/arenden/${arende.id}`}
            className="flex flex-col gap-1.5 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-surface-emphasis focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-tabular shrink-0 font-mono text-[11px] text-muted-foreground">
                {arende.arendenummer}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                {arende.rubrik}
              </span>
              <StatusChip status={arende.status} />
              <PrioritetChip prioritet={arende.prioritet} />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {kategoriLabel[arende.kategori]} · {personalNamn(personal, arende.ansvarigId)} · uppdaterat{' '}
              {relativTid(arende.uppdaterad)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function ProfilSkelett() {
  return (
    <Sida bred>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-64" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
      </div>
    </Sida>
  )
}
