'use client'

import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  CalendarPlusIcon,
  CheckCircle2Icon,
  ClockIcon,
  HeadphonesIcon,
  InboxIcon,
  LoaderIcon,
  MonitorSmartphoneIcon,
  PhoneIcon,
  UserRoundSearchIcon,
  WrenchIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { Nyckeltal, NyckeltalSkelett } from '@/components/portal/oversikt/nyckeltal'
import {
  DriftFelBanner,
  PrioritetChip,
  Sektionsrubrik,
  Sida,
  Sidhuvud,
  StatusChip,
  Yta,
} from '@/components/portal/ui-delar'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { useOperativAdminData } from '@/hooks/use-operativ-admin-data'
import { personalNamn } from '@/lib/personal'
import { bokningTypLabel, prioritetVikt, relativTid } from '@/lib/labels'
import { arDemogastEpost } from '@/lib/auth/demo-guest'
import type { Aktivitet, Anvandare, Arende, Bokning, BokningTyp } from '@/lib/types'

const OPPNA: Arende['status'][] = ['ny', 'pagaende', 'vantar_pa_kund', 'bokad']

/** Ärenden utan svar i mer än ett dygn räknas som eftersatta. */
const EFTERSATT_TIMMAR = 24

const bokningIkon: Record<BokningTyp, typeof PhoneIcon> = {
  hembesok: MonitorSmartphoneIcon,
  distanssupport: HeadphonesIcon,
  verkstadsbesok: WrenchIcon,
  telefonkontakt: PhoneIcon,
}

export function OversiktVy() {
  const { db, laddar, fel, uppdatera } = useOperativAdminData()
  const { anvandare } = useAuth()
  const demogast = arDemogastEpost(anvandare?.epost)

  const data = useMemo(() => {
    if (!db) return null

    const oppna = db.arenden.filter((a) => OPPNA.includes(a.status))
    const nu = Date.now()

    const eftersatta = oppna.filter((a) => {
      const senast = a.sistaSvar ?? a.skapad
      return nu - new Date(senast).getTime() > EFTERSATT_TIMMAR * 3600_000
    })

    const kraverUppmarksamhet = oppna
      .filter((a) => a.prioritet === 'kritisk' || eftersatta.includes(a) || !a.ansvarigId)
      .sort(
        (a, b) =>
          prioritetVikt[b.prioritet] - prioritetVikt[a.prioritet] ||
          +new Date(a.sistaSvar ?? a.skapad) - +new Date(b.sistaSvar ?? b.skapad),
      )
      .slice(0, 6)

    const idag = new Date().toISOString().slice(0, 10)

    return {
      nya: db.arenden.filter((a) => a.status === 'ny').length,
      pagaende: db.arenden.filter((a) => a.status === 'pagaende').length,
      vantarPaKund: db.arenden.filter((a) => a.status === 'vantar_pa_kund').length,
      hogPrioritet: oppna.filter((a) => a.prioritet === 'hog' || a.prioritet === 'kritisk').length,
      lostaIdag: db.arenden.filter(
        (a) => a.status === 'lost' && a.uppdaterad.slice(0, 10) === idag,
      ).length,
      minaOppna: oppna.filter((a) => a.ansvarigId === anvandare?.id).length,
      dagensBokningar: db.bokningar
        .filter((b) => b.datum === idag && b.status !== 'avbokad')
        .sort((a, b) => a.tid.localeCompare(b.tid)),
      senasteAktivitet: db.aktiviteter
        .slice()
        .sort((a, b) => +new Date(b.tidpunkt) - +new Date(a.tidpunkt))
        .slice(0, 7),
      kraverUppmarksamhet,
      eftersattaAntal: eftersatta.length,
      arendeNummer: new Map(db.arenden.map((a) => [a.id, a.arendenummer])),
    }
  }, [db, anvandare?.id])

  const fornamn = anvandare?.namn.split(' ')[0] ?? ''

  return (
    <Sida bred>
      <Sidhuvud
        rubrik={`Hej ${fornamn}`}
        beskrivning={
          laddar || !data
            ? 'Läser in dagens läge…'
            : `${data.nya + data.pagaende + data.vantarPaKund} öppna ärenden, ${data.dagensBokningar.length} bokningar idag och ${data.minaOppna} ärenden tilldelade dig.`
        }
      >
        {demogast ? (
          <Button size="sm" render={<a href="https://nova-it.se/kontakt?form=request" target="_blank" rel="noreferrer" />}>
            <InboxIcon data-icon="inline-start" />
            Skicka ärendeförfrågan
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm" render={<Link href="/portal/bokningar?ny=1" />}>
              <CalendarPlusIcon data-icon="inline-start" />
              Ny bokning
            </Button>
            <Button size="sm" render={<Link href="/portal/arenden?status=ny" />}>
              <InboxIcon data-icon="inline-start" />
              Nya ärenden
            </Button>
          </>
        )}
      </Sidhuvud>

      {fel && <DriftFelBanner vidForsokIgen={uppdatera} />}

      {/* Nyckeltal */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {laddar || !data ? (
          Array.from({ length: 6 }).map((_, i) => <NyckeltalSkelett key={i} />)
        ) : (
          <>
            <Nyckeltal
              etikett="Nya ärenden"
              varde={data.nya}
              ikon={InboxIcon}
              ton="primar"
              href="/portal/arenden?status=ny"
              fotnot="obehandlade"
            />
            <Nyckeltal
              etikett="Pågående"
              varde={data.pagaende}
              ikon={LoaderIcon}
              href="/portal/arenden?status=pagaende"
            />
            <Nyckeltal
              etikett="Väntar på kund"
              varde={data.vantarPaKund}
              ikon={ClockIcon}
              ton="varning"
              href="/portal/arenden?status=vantar_pa_kund"
            />
            <Nyckeltal
              etikett="Hög prioritet"
              varde={data.hogPrioritet}
              ikon={AlertTriangleIcon}
              ton="kritisk"
              href="/portal/arenden?prioritet=hog"
            />
            <Nyckeltal
              etikett="Mina ärenden"
              varde={data.minaOppna}
              ikon={UserRoundSearchIcon}
              href="/portal/arenden?mina=1"
            />
            <Nyckeltal
              etikett="Lösta idag"
              varde={data.lostaIdag}
              ikon={CheckCircle2Icon}
              ton="klar"
              href="/portal/arenden?status=lost"
            />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <KraverUppmarksamhet
            laddar={laddar}
            arenden={data?.kraverUppmarksamhet ?? []}
            eftersatta={data?.eftersattaAntal ?? 0}
            personal={db?.personal ?? []}
          />
          <DagensBokningar
            laddar={laddar}
            bokningar={data?.dagensBokningar ?? []}
            personal={db?.personal ?? []}
          />
        </div>

        <div className="flex flex-col gap-4">
          <Snabbatgarder />
          <SenasteAktivitet
            laddar={laddar}
            aktiviteter={data?.senasteAktivitet ?? []}
            arendeNummer={data?.arendeNummer ?? new Map()}
          />
        </div>
      </div>
    </Sida>
  )
}

function KraverUppmarksamhet({
  laddar,
  arenden,
  eftersatta,
  personal,
}: {
  laddar: boolean
  arenden: Arende[]
  eftersatta: number
  personal: Anvandare[]
}) {
  return (
    <Yta className="flex flex-col gap-3 p-4">
      <Sektionsrubrik
        antal={laddar ? undefined : arenden.length}
        atgard={
          <Button variant="ghost" size="sm" render={<Link href="/portal/arenden" />}>
            Alla ärenden
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        }
      >
        Kräver uppmärksamhet
      </Sektionsrubrik>

      <p className="-mt-1 text-[12px] leading-relaxed text-muted-foreground">
        Kritisk prioritet, saknad ansvarig eller inget svar på över {EFTERSATT_TIMMAR} timmar
        {eftersatta > 0 && ` (${eftersatta} eftersatta)`}.
      </p>

      {laddar ? (
        <RadSkelett antal={4} />
      ) : arenden.length === 0 ? (
        <Empty className="bg-surface-emphasis py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CheckCircle2Icon className="text-success" />
            </EmptyMedia>
            <EmptyTitle>Ingenting brinner</EmptyTitle>
            <EmptyDescription>
              Alla öppna ärenden har ansvarig och är besvarade inom ett dygn.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-1">
          {arenden.map((arende) => (
            <li key={arende.id}>
              <Link
                href={`/portal/arenden/${arende.id}`}
                className="flex flex-col gap-1.5 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-surface-emphasis focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-3"
              >
                <span className="text-tabular shrink-0 font-mono text-[11px] text-muted-foreground">
                  {arende.arendenummer}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                  {arende.rubrik}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <PrioritetChip prioritet={arende.prioritet} />
                  <StatusChip status={arende.status} />
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground sm:w-32 sm:text-right">
                  {arende.ansvarigId ? personalNamn(personal, arende.ansvarigId) : 'Ej tilldelad'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Yta>
  )
}

function DagensBokningar({
  laddar,
  bokningar,
  personal,
}: {
  laddar: boolean
  bokningar: Bokning[]
  personal: Anvandare[]
}) {
  return (
    <Yta className="flex flex-col gap-3 p-4">
      <Sektionsrubrik
        antal={laddar ? undefined : bokningar.length}
        atgard={
          <Button variant="ghost" size="sm" render={<Link href="/portal/bokningar" />}>
            Kalender
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        }
      >
        Dagens bokningar
      </Sektionsrubrik>

      {laddar ? (
        <RadSkelett antal={3} />
      ) : bokningar.length === 0 ? (
        <Empty className="bg-surface-emphasis py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarPlusIcon />
            </EmptyMedia>
            <EmptyTitle>Inga bokningar idag</EmptyTitle>
            <EmptyDescription>Dagen är fri för inkommande ärenden.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-1">
          {bokningar.map((bokning) => {
            const Ikon = bokningIkon[bokning.typ]
            return (
              <li
                key={bokning.id}
                className="flex items-center gap-3 rounded-lg bg-surface-emphasis px-3 py-2.5"
              >
                <span className="text-tabular shrink-0 text-[13px] font-semibold">
                  {bokning.tid}
                </span>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <Ikon className="size-3.5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] font-medium">{bokning.kundNamn}</span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {bokningTypLabel[bokning.typ]} · {bokning.langdMinuter} min ·{' '}
                    {personalNamn(personal, bokning.tekniker)}
                  </span>
                </span>
                {bokning.arendeId && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Öppna ärende ${bokning.arendenummer}`}
                    render={<Link href={`/portal/arenden/${bokning.arendeId}`} />}
                  >
                    <ArrowRightIcon />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Yta>
  )
}

function Snabbatgarder() {
  const atgarder = [
    { href: '/portal/arenden?status=ny', etikett: 'Behandla nya ärenden', ikon: InboxIcon },
    { href: '/portal/arenden?mina=1', etikett: 'Mina tilldelade ärenden', ikon: UserRoundSearchIcon },
    { href: '/portal/bokningar?ny=1', etikett: 'Skapa bokning', ikon: CalendarPlusIcon },
    { href: '/portal/kunder', etikett: 'Sök kund', ikon: UserRoundSearchIcon },
  ]

  return (
    <Yta className="flex flex-col gap-3 p-4">
      <Sektionsrubrik>Snabbåtgärder</Sektionsrubrik>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-1">
        {atgarder.map((a) => (
          <Link
            key={a.etikett}
            href={a.href}
            className="flex items-center gap-2.5 rounded-lg bg-surface-emphasis px-3 py-2.5 text-[13px] font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <a.ikon className="size-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate">{a.etikett}</span>
            <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </Yta>
  )
}

function SenasteAktivitet({
  laddar,
  aktiviteter,
  arendeNummer,
}: {
  laddar: boolean
  aktiviteter: Aktivitet[]
  arendeNummer: Map<string, string>
}) {
  return (
    <Yta className="flex flex-col gap-3 p-4">
      <Sektionsrubrik>Senaste aktivitet</Sektionsrubrik>
      {laddar ? (
        <RadSkelett antal={5} />
      ) : aktiviteter.length === 0 ? (
        <Empty className="bg-surface-emphasis py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ActivityIcon />
            </EmptyMedia>
            <EmptyTitle>Ingen aktivitet ännu</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col">
          {aktiviteter.map((akt, i) => (
            <li key={akt.id} className="flex gap-3">
              {/* Tidslinje: punkt + streck istället för avdelare mellan rader. */}
              <div className="flex flex-col items-center pt-1.5">
                <span className="size-1.5 shrink-0 rounded-full bg-primary/70" />
                {i < aktiviteter.length - 1 && <span className="w-px flex-1 bg-border" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-3.5">
                <p className="text-[13px] leading-snug text-text-secondary">{akt.beskrivning}</p>
                <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Link
                    href={`/portal/arenden/${akt.arendeId}`}
                    className="font-mono transition-colors hover:text-primary"
                  >
                    {arendeNummer.get(akt.arendeId) ?? akt.arendeId}
                  </Link>
                  <span aria-hidden>·</span>
                  <span>{akt.aktor}</span>
                  <span aria-hidden>·</span>
                  <span>{relativTid(akt.tidpunkt)}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Yta>
  )
}

function RadSkelett({ antal }: { antal: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: antal }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg bg-surface-emphasis px-3 py-3">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}
