'use client'

import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  FilterXIcon,
  InboxIcon,
  PlusIcon,
  SearchIcon,
  SearchXIcon,
  TicketIcon,
  Trash2Icon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
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
import { ArendeDialog } from '@/components/portal/arenden/arende-dialog'
import { FilterVal } from '@/components/portal/filter-val'
import {
  DriftFelBanner,
  KundtypChip,
  PrioritetChip,
  Sida,
  Sidhuvud,
  StatusChip,
  Yta,
} from '@/components/portal/ui-delar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useOperativAdminData } from '@/hooks/use-operativ-admin-data'
import { taBortArenden } from '@/lib/store'
import { personalNamn } from '@/lib/personal'
import {
  kanalLabel,
  kategoriLabel,
  kundtypLabel,
  prioritetLabel,
  prioritetOrdning,
  prioritetVikt,
  relativTid,
  statusLabel,
  statusOrdning,
} from '@/lib/labels'
import type { Anvandare, Arende } from '@/lib/types'

type Sortering = 'uppdaterad' | 'skapad' | 'prioritet' | 'nummer' | 'kund' | 'kategori' | 'status' | 'ansvarig'
type SorteringsRiktning = 'asc' | 'desc'

const sorteringLabel: Record<Sortering, string> = {
  uppdaterad: 'Senast uppdaterad',
  skapad: 'Nyast inkommen',
  prioritet: 'Högsta prioritet',
  nummer: 'Ärendenummer',
  kund: 'Kund (A–Ö)',
  kategori: 'Kategori (A–Ö)',
  status: 'Status',
  ansvarig: 'Ansvarig (A–Ö)',
}

/** Standardriktning per kolumn när man klickar den för första gången. */
const standardRiktning: Record<Sortering, SorteringsRiktning> = {
  uppdaterad: 'desc',
  skapad: 'desc',
  prioritet: 'desc',
  nummer: 'desc',
  kund: 'asc',
  kategori: 'asc',
  status: 'asc',
  ansvarig: 'asc',
}

function sorteringsVarde(arende: Arende, sortering: Sortering, personal: Anvandare[]): string | number {
  switch (sortering) {
    case 'skapad':
      return +new Date(arende.skapad)
    case 'prioritet':
      return prioritetVikt[arende.prioritet]
    case 'nummer':
      return arende.arendenummer
    case 'kund':
      return arende.kundNamn.toLowerCase()
    case 'kategori':
      return kategoriLabel[arende.kategori].toLowerCase()
    case 'status':
      return statusOrdning.indexOf(arende.status)
    case 'ansvarig':
      return personalNamn(personal, arende.ansvarigId).toLowerCase()
    default:
      return +new Date(arende.uppdaterad)
  }
}

const STANDARD = {
  sok: '',
  status: 'alla',
  prioritet: 'alla',
  kundtyp: 'alla',
  kategori: 'alla',
  ansvarig: 'alla',
  sortering: 'uppdaterad' as Sortering,
}

/**
 * Ärendelistan. Filtren är klientnära ovanpå den operativa admin-datan; vid
 * större datamängder kan urvalet flyttas till serversidan med samma parametrar.
 */
export function Arendelista() {
  const { db, laddar, fel, uppdatera } = useOperativAdminData()
  const { anvandare, kan } = useAuth()
  const router = useRouter()
  const params = useSearchParams()

  // Genvägar från översikten kommer in som query-parametrar.
  const [sok, setSok] = useState('')
  const [status, setStatus] = useState(params.get('status') ?? STANDARD.status)
  const [prioritet, setPrioritet] = useState(params.get('prioritet') ?? STANDARD.prioritet)
  const [kundtyp, setKundtyp] = useState(STANDARD.kundtyp)
  const [kategori, setKategori] = useState(STANDARD.kategori)
  const [ansvarig, setAnsvarig] = useState(
    params.get('mina') === '1' ? (anvandare?.id ?? STANDARD.ansvarig) : STANDARD.ansvarig,
  )
  const [sortering, setSortering] = useState<Sortering>(STANDARD.sortering)
  const [sorteringsRiktning, setSorteringsRiktning] = useState<SorteringsRiktning>(
    standardRiktning[STANDARD.sortering],
  )
  const [nyttArendeOppen, setNyttArendeOppen] = useState(false)
  const [valda, setValda] = useState<Set<string>>(new Set())
  const [tarBortValda, setTarBortValda] = useState(false)

  /** Klick på en kolumnrubrik: byt kolumn (med dess standardriktning), eller
   * växla riktning om samma kolumn klickas igen. */
  function sorteraPa(ny: Sortering) {
    if (ny === sortering) {
      setSorteringsRiktning((r) => (r === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortering(ny)
      setSorteringsRiktning(standardRiktning[ny])
    }
  }

  useEffect(() => {
    if (params.get('ny') === '1' && kan('skapa_arende')) setNyttArendeOppen(true)
  }, [params, kan])

  const personal = db?.personal ?? []

  // Alltid synlig kö, oberoende av filtren ovan - staben ska aldrig behöva
  // veta att statusfiltret finns för att hitta obehandlade ärenden. Äldst
  // (mest eftersatt) visas först, FIFO, till skillnad från huvudlistans
  // "senast uppdaterad"-standard.
  const nyaArenden = useMemo(() => {
    if (!db) return []
    return db.arenden
      .filter((a) => a.status === 'ny')
      .sort((a, b) => +new Date(a.skapad) - +new Date(b.skapad))
  }, [db])

  const filtreradeArenden = useMemo(() => {
    if (!db) return []
    const fras = sok.trim().toLowerCase()

    const urval = db.arenden.filter((a) => {
      if (status !== 'alla' && a.status !== status) return false
      if (prioritet !== 'alla' && a.prioritet !== prioritet) return false
      if (kundtyp !== 'alla' && a.kundtyp !== kundtyp) return false
      if (kategori !== 'alla' && a.kategori !== kategori) return false
      if (ansvarig === 'ingen' && a.ansvarigId) return false
      if (ansvarig !== 'alla' && ansvarig !== 'ingen' && a.ansvarigId !== ansvarig) return false
      if (!fras) return true
      return [a.arendenummer, a.rubrik, a.kundNamn, a.organisation ?? '', a.beskrivning, a.epost]
        .join(' ')
        .toLowerCase()
        .includes(fras)
    })

    const riktning = sorteringsRiktning === 'asc' ? 1 : -1
    return urval.sort((a, b) => {
      const va = sorteringsVarde(a, sortering, personal)
      const vb = sorteringsVarde(b, sortering, personal)
      if (va === vb) return +new Date(b.uppdaterad) - +new Date(a.uppdaterad)
      return va < vb ? -riktning : riktning
    })
  }, [db, sok, status, prioritet, kundtyp, kategori, ansvarig, sortering, sorteringsRiktning, personal])

  const antalAktivaFilter = [
    status !== STANDARD.status,
    prioritet !== STANDARD.prioritet,
    kundtyp !== STANDARD.kundtyp,
    kategori !== STANDARD.kategori,
    ansvarig !== STANDARD.ansvarig,
    sok.trim() !== '',
  ].filter(Boolean).length

  function aterstall() {
    setSok(STANDARD.sok)
    setStatus(STANDARD.status)
    setPrioritet(STANDARD.prioritet)
    setKundtyp(STANDARD.kundtyp)
    setKategori(STANDARD.kategori)
    setAnsvarig(STANDARD.ansvarig)
    setSortering(STANDARD.sortering)
    setSorteringsRiktning(standardRiktning[STANDARD.sortering])
    router.replace('/portal/arenden')
  }

  return (
    <Sida bred>
      <Sidhuvud
        rubrik="Ärenden"
        beskrivning="Ärenden från kontaktformuläret, supportassistenten och telefon – samlade på ett ställe."
      >
        <div className="flex items-center gap-2">
          {antalAktivaFilter > 0 && (
            <Button variant="ghost" size="sm" onClick={aterstall}>
              <FilterXIcon data-icon="inline-start" />
              Återställ filter ({antalAktivaFilter})
            </Button>
          )}
          {kan('ta_bort_arende') && valda.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive" size="sm" disabled={tarBortValda}>
                    <Trash2Icon data-icon="inline-start" />
                    Ta bort valda ({valda.size})
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia className="bg-destructive/10 text-destructive">
                    <Trash2Icon />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Ta bort {valda.size} ärenden permanent?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ärendena och all deras konversation raderas permanent och kan inte återställas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      setTarBortValda(true)
                      try {
                        await taBortArenden([...valda])
                        toast.success(`${valda.size} ärenden borttagna`)
                        setValda(new Set())
                        uppdatera()
                      } catch (error) {
                        toast.error('Kunde inte ta bort ärendena', {
                          description: error instanceof Error ? error.message : undefined,
                        })
                      } finally {
                        setTarBortValda(false)
                      }
                    }}
                  >
                    Ta bort permanent
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            size="sm"
            disabled={!kan('skapa_arende')}
            onClick={() => setNyttArendeOppen(true)}
          >
            <PlusIcon data-icon="inline-start" />
            Nytt ärende
          </Button>
        </div>
      </Sidhuvud>

      {fel && <DriftFelBanner vidForsokIgen={uppdatera} />}

      {!laddar && <NyaArendenKo arenden={nyaArenden} personal={personal} />}

      <Yta className="flex flex-col">
        {/* Filterrad */}
        <div className="flex flex-col gap-3 p-3.5">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <InputGroup className="h-8 max-w-full border-transparent bg-surface-emphasis lg:max-w-[320px]">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                value={sok}
                onChange={(e) => setSok(e.target.value)}
                placeholder="Sök ärendenummer, kund eller text"
                aria-label="Sök bland ärenden"
              />
              {sok && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    onClick={() => setSok('')}
                    aria-label="Rensa sökningen"
                  >
                    <XIcon />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>

            <div className="flex flex-wrap items-center gap-2">
              <FilterVal
                etikett="Status"
                varde={status}
                vidAndring={setStatus}
                alternativ={[
                  { varde: 'alla', etikett: 'Alla statusar' },
                  ...statusOrdning.map((s) => ({ varde: s, etikett: statusLabel[s] })),
                ]}
              />
              <FilterVal
                etikett="Prioritet"
                varde={prioritet}
                vidAndring={setPrioritet}
                alternativ={[
                  { varde: 'alla', etikett: 'Alla prioriteter' },
                  ...[...prioritetOrdning].reverse().map((p) => ({
                    varde: p,
                    etikett: prioritetLabel[p],
                  })),
                ]}
              />
              <FilterVal
                etikett="Kund"
                varde={kundtyp}
                vidAndring={setKundtyp}
                bredd="w-[168px]"
                alternativ={[
                  { varde: 'alla', etikett: 'Alla kundtyper' },
                  { varde: 'privatperson', etikett: kundtypLabel.privatperson },
                  { varde: 'verksamhet', etikett: kundtypLabel.verksamhet },
                ]}
              />
              <FilterVal
                etikett="Kategori"
                varde={kategori}
                vidAndring={setKategori}
                bredd="w-[200px]"
                alternativ={[
                  { varde: 'alla', etikett: 'Alla kategorier' },
                  ...(Object.keys(kategoriLabel) as (keyof typeof kategoriLabel)[]).map((k) => ({
                    varde: k,
                    etikett: kategoriLabel[k],
                  })),
                ]}
              />
              <FilterVal
                etikett="Ansvarig"
                varde={ansvarig}
                vidAndring={setAnsvarig}
                bredd="w-[190px]"
                alternativ={[
                  { varde: 'alla', etikett: 'Alla ansvariga' },
                  { varde: 'ingen', etikett: 'Ej tilldelade' },
                  ...personal.map((p) => ({
                    varde: p.id,
                    etikett: p.id === anvandare?.id ? `${p.namn} (jag)` : p.namn,
                  })),
                ]}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] text-muted-foreground">
              {laddar ? (
                'Läser in ärenden…'
              ) : (
                <>
                  Visar{' '}
                  <span className="text-tabular font-medium text-foreground">
                    {filtreradeArenden.length}
                  </span>{' '}
                  av {db?.arenden.length ?? 0} ärenden
                </>
              )}
            </p>
            <FilterVal
              etikett="Sortera"
              varde={sortering}
              vidAndring={(v) => {
                setSortering(v as Sortering)
                setSorteringsRiktning(standardRiktning[v as Sortering])
              }}
              bredd="w-[212px]"
              alternativ={(Object.keys(sorteringLabel) as Sortering[]).map((s) => ({
                varde: s,
                etikett: sorteringLabel[s],
              }))}
            />
          </div>
        </div>

        {laddar ? (
          <TabellSkelett />
        ) : filtreradeArenden.length === 0 && fel ? (
          <div className="p-3.5 pt-0">
            <Empty className="bg-surface-emphasis py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TriangleAlertIcon />
                </EmptyMedia>
                <EmptyTitle>Kan inte visa ärenden just nu</EmptyTitle>
                <EmptyDescription>
                  Listan kunde inte hämtas från servern – se felmeddelandet ovan och försök igen.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : filtreradeArenden.length === 0 ? (
          <div className="p-3.5 pt-0">
            <Empty className="bg-surface-emphasis py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  {antalAktivaFilter > 0 ? <SearchXIcon /> : <TicketIcon />}
                </EmptyMedia>
                <EmptyTitle>
                  {antalAktivaFilter > 0 ? 'Inga ärenden matchar filtret' : 'Inga ärenden ännu'}
                </EmptyTitle>
                <EmptyDescription>
                  {antalAktivaFilter > 0
                    ? 'Prova att söka bredare eller återställ filtren för att se alla ärenden.'
                    : 'Nya ärenden hamnar här så snart en kund hör av sig.'}
                </EmptyDescription>
              </EmptyHeader>
              {antalAktivaFilter > 0 && (
                <Button variant="outline" size="sm" onClick={aterstall}>
                  <FilterXIcon data-icon="inline-start" />
                  Återställ filter
                </Button>
              )}
            </Empty>
          </div>
        ) : (
          <ArendeTabell
            arenden={filtreradeArenden}
            personal={personal}
            sortering={sortering}
            sorteringsRiktning={sorteringsRiktning}
            vidSortera={sorteraPa}
            valda={kan('ta_bort_arende') ? valda : undefined}
            vidVaxlaVald={
              kan('ta_bort_arende')
                ? (id) =>
                    setValda((tidigare) => {
                      const nya = new Set(tidigare)
                      if (nya.has(id)) nya.delete(id)
                      else nya.add(id)
                      return nya
                    })
                : undefined
            }
          />
        )}
      </Yta>

      <ArendeDialog
        oppen={nyttArendeOppen}
        setOppen={setNyttArendeOppen}
        kunder={db?.kunder ?? []}
        kategorier={db?.kategorier.filter((k) => k.aktiv) ?? []}
      />
    </Sida>
  )
}

/**
 * Alltid synlig kö över obehandlade nya ärenden, oberoende av statusfiltret
 * i huvudlistan nedanför - staben ska aldrig missa ett nytt ärende bara för
 * att statusfiltret råkar stå på något annat än "Ny".
 */
function NyaArendenKo({ arenden, personal }: { arenden: Arende[]; personal: Anvandare[] }) {
  return (
    <Yta className="flex flex-col border-warning/40">
      <div className="flex items-center gap-2 border-b border-border/60 px-3.5 py-2.5">
        <InboxIcon className="size-4 text-warning" aria-hidden />
        <h2 className="text-sm font-semibold">Nya ärenden</h2>
        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning">
          {arenden.length}
        </span>
      </div>
      {arenden.length === 0 ? (
        <div className="flex items-center gap-2 px-3.5 py-4 text-[13px] text-muted-foreground">
          <CheckCircle2Icon className="size-4" aria-hidden />
          Inga nya, obehandlade ärenden just nu.
        </div>
      ) : (
        <ArendeTabell arenden={arenden} personal={personal} />
      )}
    </Yta>
  )
}

function ArendeTabell({
  arenden,
  personal,
  sortering,
  sorteringsRiktning,
  vidSortera,
  valda,
  vidVaxlaVald,
}: {
  arenden: Arende[]
  personal: Anvandare[]
  sortering?: Sortering
  sorteringsRiktning?: SorteringsRiktning
  vidSortera?: (sortering: Sortering) => void
  valda?: Set<string>
  vidVaxlaVald?: (id: string) => void
}) {
  const router = useRouter()
  const visaKryssrutor = valda !== undefined && vidVaxlaVald !== undefined

  function Rubrik({ falt, children }: { falt: Sortering; children: React.ReactNode }) {
    if (!vidSortera) return <>{children}</>
    const aktiv = sortering === falt
    return (
      <button
        type="button"
        onClick={() => vidSortera(falt)}
        className="inline-flex items-center gap-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
        {aktiv &&
          (sorteringsRiktning === 'asc' ? (
            <ArrowUpIcon className="size-3" aria-hidden />
          ) : (
            <ArrowDownIcon className="size-3" aria-hidden />
          ))}
      </button>
    )
  }

  return (
    <Table className="text-[13px]">
      <TableHeader>
        <TableRow className="border-border/70 hover:bg-transparent">
          {visaKryssrutor && (
            <TableHead className="h-9 w-9 pl-4">
              <Checkbox
                aria-label="Välj alla synliga ärenden"
                checked={arenden.length > 0 && arenden.every((a) => valda.has(a.id))}
                indeterminate={
                  arenden.some((a) => valda.has(a.id)) && !arenden.every((a) => valda.has(a.id))
                }
                onCheckedChange={(checked) => {
                  arenden.forEach((a) => {
                    const redanVald = valda.has(a.id)
                    if (checked && !redanVald) vidVaxlaVald(a.id)
                    if (!checked && redanVald) vidVaxlaVald(a.id)
                  })
                }}
              />
            </TableHead>
          )}
          <TableHead className="h-9 pl-4 text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
            <Rubrik falt="nummer">Ärende</Rubrik>
          </TableHead>
          <TableHead className="h-9 text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
            <Rubrik falt="kund">Kund</Rubrik>
          </TableHead>
          <TableHead className="hidden h-9 text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground xl:table-cell">
            <Rubrik falt="kategori">Kategori</Rubrik>
          </TableHead>
          <TableHead className="h-9 text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
            <Rubrik falt="status">Status</Rubrik>
          </TableHead>
          <TableHead className="h-9 text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
            <Rubrik falt="prioritet">Prioritet</Rubrik>
          </TableHead>
          <TableHead className="hidden h-9 text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground lg:table-cell">
            <Rubrik falt="ansvarig">Ansvarig</Rubrik>
          </TableHead>
          <TableHead className="h-9 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
            <span className="inline-flex items-center justify-end gap-1 [&>button]:flex-row-reverse">
              <Rubrik falt="uppdaterad">
                <ArrowUpDownIcon className="size-3" aria-hidden />
                Uppdaterad
              </Rubrik>
            </span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {arenden.map((arende) => (
          <TableRow
            key={arende.id}
            onClick={() => router.push(`/portal/arenden/${arende.id}`)}
            className="cursor-pointer border-border/40 hover:bg-surface-emphasis"
          >
            {visaKryssrutor && (
              <TableCell className="w-9 pl-4" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  aria-label={`Välj ärende ${arende.arendenummer}`}
                  checked={valda.has(arende.id)}
                  onCheckedChange={() => vidVaxlaVald(arende.id)}
                />
              </TableCell>
            )}
            <TableCell className="max-w-[420px] py-2.5 pl-4">
              <div className="flex flex-col gap-0.5">
                <Link
                  href={`/portal/arenden/${arende.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="truncate font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {arende.rubrik}
                </Link>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="text-tabular font-mono">{arende.arendenummer}</span>
                  <span aria-hidden>·</span>
                  <span className="truncate">{kanalLabel[arende.kanal]}</span>
                </span>
              </div>
            </TableCell>
            <TableCell className="py-2.5">
              <div className="flex flex-col gap-1">
                <span className="max-w-[180px] truncate">{arende.kundNamn}</span>
                <KundtypChip kundtyp={arende.kundtyp} />
              </div>
            </TableCell>
            <TableCell className="hidden py-2.5 xl:table-cell">
              <div className="flex flex-col gap-0.5">
                <span className="text-text-secondary">{kategoriLabel[arende.kategori]}</span>
                <span className="max-w-[200px] truncate text-[11px] text-muted-foreground">
                  {arende.underkategori}
                </span>
              </div>
            </TableCell>
            <TableCell className="py-2.5">
              <StatusChip status={arende.status} />
            </TableCell>
            <TableCell className="py-2.5">
              <PrioritetChip prioritet={arende.prioritet} />
            </TableCell>
            <TableCell className="hidden py-2.5 lg:table-cell">
              <span className={arende.ansvarigId ? 'text-text-secondary' : 'text-muted-foreground'}>
                {personalNamn(personal, arende.ansvarigId)}
              </span>
            </TableCell>
            <TableCell className="py-2.5 pr-4 text-right text-[12px] text-muted-foreground">
              {relativTid(arende.uppdaterad)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function TabellSkelett() {
  return (
    <div className="flex flex-col gap-px px-3.5 pb-3.5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg px-2 py-3">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="hidden h-4 w-24 lg:block" />
        </div>
      ))}
    </div>
  )
}
