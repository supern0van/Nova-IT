'use client'

import {
  BuildingIcon,
  PlusIcon,
  SearchIcon,
  SearchXIcon,
  UserRoundIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { FilterVal } from '@/components/portal/filter-val'
import { KundDialog } from '@/components/portal/kunder/kund-dialog'
import { KundtypChip, Sida, Sidhuvud, Yta } from '@/components/portal/ui-delar'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import { useOperativAdminData } from '@/hooks/use-operativ-admin-data'
import { kundtypLabel, relativTid } from '@/lib/labels'
import type { Arende, Kund } from '@/lib/types'

const OPPNA: Arende['status'][] = ['ny', 'pagaende', 'vantar_pa_kund', 'bokad']

type Sortering = 'senaste' | 'namn' | 'oppna'

const sorteringLabel: Record<Sortering, string> = {
  senaste: 'Senaste kontakt',
  namn: 'Namn A–Ö',
  oppna: 'Flest öppna ärenden',
}

/**
 * Kundregistret. Söker på namn, organisation, e-post, telefon och ort så att
 * personalen kan hitta kunden med den uppgift de råkar ha framför sig.
 */
export function Kundlista() {
  const { db, laddar } = useOperativAdminData()
  const { kan } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const [sok, setSok] = useState('')
  const [kundtyp, setKundtyp] = useState('alla')
  const [sortering, setSortering] = useState<Sortering>('senaste')
  const [nyKundOppen, setNyKundOppen] = useState(false)

  useEffect(() => {
    if (params.get('ny') === '1' && kan('redigera_kund')) setNyKundOppen(true)
  }, [params, kan])

  const kunder = useMemo(() => {
    if (!db) return []
    const fras = sok.trim().toLowerCase()

    const antalPerKund = new Map<string, { oppna: number; totalt: number }>()
    for (const arende of db.arenden) {
      const rad = antalPerKund.get(arende.kundId) ?? { oppna: 0, totalt: 0 }
      rad.totalt += 1
      if (OPPNA.includes(arende.status)) rad.oppna += 1
      antalPerKund.set(arende.kundId, rad)
    }

    const urval = db.kunder
      .filter((k) => {
        if (kundtyp !== 'alla' && k.kundtyp !== kundtyp) return false
        if (!fras) return true
        return [k.namn, k.organisation ?? '', k.epost, k.telefon, k.ort, k.kontaktperson ?? '']
          .join(' ')
          .toLowerCase()
          .includes(fras)
      })
      .map((k) => ({
        kund: k,
        oppna: antalPerKund.get(k.id)?.oppna ?? 0,
        totalt: antalPerKund.get(k.id)?.totalt ?? 0,
      }))

    return urval.sort((a, b) => {
      switch (sortering) {
        case 'namn':
          return a.kund.namn.localeCompare(b.kund.namn, 'sv')
        case 'oppna':
          return b.oppna - a.oppna || a.kund.namn.localeCompare(b.kund.namn, 'sv')
        default:
          return +new Date(b.kund.senasteKontakt) - +new Date(a.kund.senasteKontakt)
      }
    })
  }, [db, sok, kundtyp, sortering])

  const antalAktivaFilter = [kundtyp !== 'alla', sok.trim() !== ''].filter(Boolean).length

  return (
    <Sida bred>
      <Sidhuvud
        rubrik="Kunder"
        beskrivning="Privatpersoner och verksamheter som Nova IT stöttar, med historik och interna anteckningar."
      >
        <Button size="sm" disabled={!kan('redigera_kund')} onClick={() => setNyKundOppen(true)}>
          <PlusIcon data-icon="inline-start" />
          Ny kund
        </Button>
      </Sidhuvud>

      <Yta className="flex flex-col gap-4 p-3.5">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <InputGroup className="h-8 max-w-full border-transparent bg-surface-emphasis sm:max-w-[320px]">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                value={sok}
                onChange={(e) => setSok(e.target.value)}
                placeholder="Sök namn, företag, e-post eller ort"
                aria-label="Sök bland kunder"
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

            <FilterVal
              etikett="Typ"
              varde={kundtyp}
              vidAndring={setKundtyp}
              bredd="w-[168px]"
              alternativ={[
                { varde: 'alla', etikett: 'Alla kundtyper' },
                { varde: 'privatperson', etikett: kundtypLabel.privatperson },
                { varde: 'verksamhet', etikett: kundtypLabel.verksamhet },
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <p className="text-[12px] text-muted-foreground">
              {laddar ? 'Läser in kunder…' : `${kunder.length} av ${db?.kunder.length ?? 0} kunder`}
            </p>
            <FilterVal
              etikett="Sortera"
              varde={sortering}
              vidAndring={(v) => setSortering(v as Sortering)}
              bredd="w-[208px]"
              alternativ={(Object.keys(sorteringLabel) as Sortering[]).map((s) => ({
                varde: s,
                etikett: sorteringLabel[s],
              }))}
            />
          </div>
        </div>

        {laddar ? (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[124px] rounded-xl" />
            ))}
          </div>
        ) : kunder.length === 0 ? (
          <Empty className="bg-surface-emphasis py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                {antalAktivaFilter > 0 ? <SearchXIcon /> : <UsersIcon />}
              </EmptyMedia>
              <EmptyTitle>
                {antalAktivaFilter > 0 ? 'Ingen kund matchar sökningen' : 'Inga kunder ännu'}
              </EmptyTitle>
              <EmptyDescription>
                {antalAktivaFilter > 0
                  ? 'Prova ett kortare sökord, eller byt kundtyp.'
                  : 'Kunder läggs upp automatiskt när ett ärende kommer in.'}
              </EmptyDescription>
            </EmptyHeader>
            {antalAktivaFilter > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSok('')
                  setKundtyp('alla')
                }}
              >
                Rensa sökningen
              </Button>
            )}
          </Empty>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {kunder.map(({ kund, oppna, totalt }) => (
              <li key={kund.id}>
                <KundKort kund={kund} oppna={oppna} totalt={totalt} />
              </li>
            ))}
          </ul>
        )}
      </Yta>

      <KundDialog
        oppen={nyKundOppen}
        setOppen={setNyKundOppen}
        vidSkapad={(kund) => router.push(`/portal/kunder/${kund.id}`)}
      />
    </Sida>
  )
}

function KundKort({ kund, oppna, totalt }: { kund: Kund; oppna: number; totalt: number }) {
  const Ikon = kund.kundtyp === 'verksamhet' ? BuildingIcon : UserRoundIcon

  return (
    <Link
      href={`/portal/kunder/${kund.id}`}
      className="flex h-full flex-col gap-3 rounded-xl bg-surface-emphasis p-3.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <Ikon className="size-4" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-[13px] font-medium">{kund.namn}</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <KundtypChip kundtyp={kund.kundtyp} />
            {kund.organisation && (
              <span className="truncate text-[11px] text-muted-foreground">
                {kund.organisation}
              </span>
            )}
          </div>
        </div>
        {oppna > 0 && (
          <span className="shrink-0 rounded-md bg-primary/14 px-1.5 py-0.5 text-[11px] font-medium leading-5 text-primary">
            {oppna} öppna
          </span>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-0.5 text-[11px] text-muted-foreground">
        <span className="truncate">{kund.epost}</span>
        <span>
          {kund.telefon} · {kund.ort}
        </span>
        <span>
          {totalt} {totalt === 1 ? 'ärende' : 'ärenden'} totalt · kontakt{' '}
          {relativTid(kund.senasteKontakt)}
        </span>
      </div>
    </Link>
  )
}
