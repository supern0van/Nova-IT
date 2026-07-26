'use client'

import { CalendarPlusIcon, CheckCircle2Icon, LockIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { PrioritetChip, StatusChip } from '@/components/portal/ui-delar'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { anvandarNamn, listaTilldelningsbara } from '@/lib/auth/demo-auth'
import {
  prioritetLabel,
  prioritetOrdning,
  statusLabel,
  statusOrdning,
} from '@/lib/labels'
import {
  andraPrioritet,
  andraStatus,
  markeraSomLost,
  tilldelaArende,
} from '@/lib/store'
import type { Arende, ArendeStatus, Prioritet } from '@/lib/types'

/**
 * Åtgärdsraden på ärendedetaljsidan: status, prioritet, ansvarig, bokning och
 * avslut. Varje kontroll speglar behörigheterna i `lib/auth/demo-auth.ts` –
 * en tekniker kan till exempel inte byta ansvarig tekniker.
 */
export function ArendeAtgarder({
  arende,
  vidBoka,
}: {
  arende: Arende
  vidBoka: () => void
}) {
  const { anvandare, kan } = useAuth()
  const [sparar, setSparar] = useState<string | null>(null)
  const tekniker = listaTilldelningsbara()
  const aktor = anvandare?.namn ?? 'Okänd'

  const kanTilldela = kan('tilldela_arende')
  const avslutat = arende.status === 'lost' || arende.status === 'stangd'

  async function bytStatus(ny: ArendeStatus) {
    if (ny === arende.status) return
    setSparar('status')
    await andraStatus(arende.id, ny, aktor, statusLabel[arende.status], statusLabel[ny])
    setSparar(null)
    toast.success(`Status: ${statusLabel[ny]}`)
  }

  async function bytPrioritet(ny: Prioritet) {
    if (ny === arende.prioritet) return
    setSparar('prioritet')
    await andraPrioritet(
      arende.id,
      ny,
      aktor,
      prioritetLabel[arende.prioritet],
      prioritetLabel[ny],
    )
    setSparar(null)
    toast.success(`Prioritet: ${prioritetLabel[ny]}`)
  }

  async function bytAnsvarig(nyttId: string) {
    const ansvarigId = nyttId === 'ingen' ? null : nyttId
    if (ansvarigId === arende.ansvarigId) return
    setSparar('ansvarig')
    await tilldelaArende(arende.id, ansvarigId, aktor, anvandarNamn(ansvarigId))
    setSparar(null)
    toast.success(ansvarigId ? `Tilldelat ${anvandarNamn(ansvarigId)}` : 'Tilldelningen togs bort')
  }

  async function avsluta() {
    setSparar('lost')
    await markeraSomLost(arende.id, aktor)
    setSparar(null)
    toast.success('Ärendet är markerat som löst')
  }

  const ansvarigVarden: Record<string, string> = {
    ingen: 'Ej tilldelad',
    ...Object.fromEntries(tekniker.map((t) => [t.id, t.namn])),
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Status */}
      <Select
        items={Object.fromEntries(statusOrdning.map((s) => [s, statusLabel[s]]))}
        value={arende.status}
        onValueChange={(v) => bytStatus(v as ArendeStatus)}
        disabled={!kan('andra_status') || sparar === 'status'}
      >
        <SelectTrigger size="sm" aria-label="Ändra status" className="border-transparent bg-surface-emphasis">
          <SelectValue>
            {(v: ArendeStatus) => <StatusChip status={v} className="bg-transparent px-0" />}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="min-w-[190px]">
          {statusOrdning.map((s) => (
            <SelectItem key={s} value={s}>
              <StatusChip status={s} className="bg-transparent px-0" />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Prioritet */}
      <Select
        items={Object.fromEntries(prioritetOrdning.map((p) => [p, prioritetLabel[p]]))}
        value={arende.prioritet}
        onValueChange={(v) => bytPrioritet(v as Prioritet)}
        disabled={!kan('andra_prioritet') || sparar === 'prioritet'}
      >
        <SelectTrigger
          size="sm"
          aria-label="Ändra prioritet"
          className="border-transparent bg-surface-emphasis"
        >
          <SelectValue>
            {(v: Prioritet) => <PrioritetChip prioritet={v} className="bg-transparent px-0" />}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="min-w-[170px]">
          {[...prioritetOrdning].reverse().map((p) => (
            <SelectItem key={p} value={p}>
              <PrioritetChip prioritet={p} className="bg-transparent px-0" />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Ansvarig – endast administratör */}
      {kanTilldela ? (
        <Select
          items={ansvarigVarden}
          value={arende.ansvarigId ?? 'ingen'}
          onValueChange={(v) => bytAnsvarig(String(v))}
          disabled={sparar === 'ansvarig'}
        >
          <SelectTrigger
            size="sm"
            aria-label="Ändra ansvarig tekniker"
            className="min-w-[172px] border-transparent bg-surface-emphasis"
          >
            <SelectValue>
              {(v: string) => (
                <span className="flex items-center gap-1.5">
                  <span className="text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
                    Ansvarig
                  </span>
                  <span className="truncate text-[13px]">{ansvarigVarden[v]}</span>
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="min-w-[220px]">
            <SelectItem value="ingen">Ej tilldelad</SelectItem>
            {tekniker.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.namn}
                <span className="text-muted-foreground"> · {t.titel}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="flex h-7 items-center gap-1.5 rounded-[min(var(--radius-md),10px)] bg-surface-emphasis px-2.5 text-[13px] text-muted-foreground">
                <LockIcon className="size-3.5" />
                Ansvarig: {anvandarNamn(arende.ansvarigId)}
              </span>
            }
          />
          <TooltipContent>Endast administratör kan byta ansvarig tekniker</TooltipContent>
        </Tooltip>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={vidBoka}
          disabled={!kan('hantera_bokningar')}
        >
          <CalendarPlusIcon data-icon="inline-start" />
          Boka tid
        </Button>
        <Button size="sm" onClick={avsluta} disabled={avslutat || sparar === 'lost'}>
          <CheckCircle2Icon data-icon="inline-start" />
          {avslutat ? 'Ärendet är löst' : 'Markera som löst'}
        </Button>
      </div>
    </div>
  )
}
