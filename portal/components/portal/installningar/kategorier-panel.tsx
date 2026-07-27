'use client'

import { InfoIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { PrioritetChip, Sektionsrubrik, Yta } from '@/components/portal/ui-delar'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import {
  adminKonfigurationEjKoppladText,
  adminKonfigurationSkrivbar,
} from '@/lib/admin/konfiguration'
import { vaxlaKategori } from '@/lib/store'
import type { Arende, Arendekategori } from '@/lib/types'

/**
 * Ärendekategorier. Namn, underkategorier och standardprioritet är låsta eftersom
 * nycklarna är hårdkopplade till `Kategori`-typen och till befintliga ärenden.
 * Det som går att styra är om kategorin ska gå att välja för nya ärenden.
 */
export function KategorierPanel({
  kategorier,
  arenden,
}: {
  kategorier: Arendekategori[]
  arenden: Arende[]
}) {
  const { kan } = useAuth()
  const kanAndra = kan('hantera_systeminstallningar') && adminKonfigurationSkrivbar
  const [sparar, setSparar] = useState<string | null>(null)

  const antalPerKategori = useMemo(() => {
    const karta = new Map<string, number>()
    for (const arende of arenden) {
      karta.set(arende.kategori, (karta.get(arende.kategori) ?? 0) + 1)
    }
    return karta
  }, [arenden])

  async function vaxla(kategori: Arendekategori) {
    setSparar(kategori.id)
    try {
      await vaxlaKategori(kategori.id)
      toast.success(
        kategori.aktiv
          ? `"${kategori.namn}" går inte längre att välja`
          : `"${kategori.namn}" går att välja igen`,
      )
    } finally {
      setSparar(null)
    }
  }

  const antalAktiva = kategorier.filter((k) => k.aktiv).length

  return (
    <Yta className="flex flex-col gap-4 p-3.5">
      <Sektionsrubrik antal={antalAktiva}>Valbara kategorier</Sektionsrubrik>

      <p className="flex items-start gap-2 rounded-lg bg-surface-emphasis p-2.5 text-[12px] leading-relaxed text-muted-foreground">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
        <span>
          {adminKonfigurationEjKoppladText} När backend finns ska avstängda kategorier döljas för
          nya ärenden medan befintliga ärenden behåller sin kategori.
        </span>
      </p>

      <ul className="flex flex-col gap-1.5">
        {kategorier.map((kategori) => {
          const antal = antalPerKategori.get(kategori.nyckel) ?? 0

          return (
            <li
              key={kategori.id}
              className="flex flex-col gap-2.5 rounded-lg bg-surface-emphasis p-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-medium">{kategori.namn}</p>
                    <PrioritetChip prioritet={kategori.standardPrioritet} />
                  </div>
                  <p className="text-[12px] text-muted-foreground">
                    Standardprioritet för nya ärenden · {antal}{' '}
                    {antal === 1 ? 'ärende' : 'ärenden'} totalt
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {sparar === kategori.id && <Spinner className="size-3.5 text-muted-foreground" />}
                  <Switch
                    checked={kategori.aktiv}
                    disabled={!kanAndra || sparar === kategori.id}
                    onCheckedChange={() => vaxla(kategori)}
                    aria-label={`Kategori: ${kategori.namn}`}
                  />
                </div>
              </div>

              {kategori.underkategorier.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {kategori.underkategorier.map((under) => (
                    <li
                      key={under}
                      className="rounded-md bg-card px-2 py-0.5 text-[11px] leading-5 text-text-secondary"
                    >
                      {under}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      {!adminKonfigurationSkrivbar && (
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Reglagen är låsta tills kategorierna har riktig serverlagring.
        </p>
      )}
    </Yta>
  )
}
