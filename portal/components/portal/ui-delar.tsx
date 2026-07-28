'use client'

import { CheckIcon, CopyIcon, TriangleAlertIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  bokningStatusChip,
  bokningStatusLabel,
  kundtypLabel,
  prioritetChip,
  prioritetDot,
  prioritetLabel,
  statusChip,
  statusDot,
  statusLabel,
} from '@/lib/labels'
import type { ArendeStatus, BokningStatus, Kundtyp, Prioritet } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Sidram. Ger alla portalsidor samma rytm och maxbredd utan att någon sida
 * behöver upprepa spacing-klasser.
 */
export function Sida({
  children,
  className,
  bred = false,
}: {
  children: React.ReactNode
  className?: string
  bred?: boolean
}) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8',
        bred ? 'max-w-[1600px]' : 'max-w-[1320px]',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Sidhuvud med rubrik, valfri beskrivning och åtgärder till höger. */
export function Sidhuvud({
  rubrik,
  beskrivning,
  children,
  className,
}: {
  rubrik: React.ReactNode
  beskrivning?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-pretty text-xl font-semibold leading-tight sm:text-[1.375rem]">
          {rubrik}
        </h1>
        {beskrivning && (
          <p className="text-pretty text-[13px] leading-relaxed text-muted-foreground">
            {beskrivning}
          </p>
        )}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  )
}

/** Statuschip: tonad yta + punkt i full kulör. Återhållsamt men läsbart. */
export function StatusChip({
  status,
  className,
  visaPunkt = true,
}: {
  status: ArendeStatus
  className?: string
  visaPunkt?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap',
        statusChip[status],
        className,
      )}
    >
      {visaPunkt && <span className={cn('size-1.5 shrink-0 rounded-full', statusDot[status])} />}
      {statusLabel[status]}
    </span>
  )
}

export function PrioritetChip({
  prioritet,
  className,
}: {
  prioritet: Prioritet
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap',
        prioritetChip[prioritet],
        className,
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', prioritetDot[prioritet])} />
      {prioritetLabel[prioritet]}
    </span>
  )
}

export function BokningStatusChip({ status }: { status: BokningStatus }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap',
        bokningStatusChip[status],
      )}
    >
      {bokningStatusLabel[status]}
    </span>
  )
}

/** Kundtyp som diskret text – privatperson vs verksamhet skiljs med ikonfärg. */
export function KundtypChip({ kundtyp }: { kundtyp: Kundtyp }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap',
        kundtyp === 'verksamhet'
          ? 'bg-chart-5/20 text-text-secondary'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {kundtypLabel[kundtyp]}
    </span>
  )
}

/** Kopieringsknapp med kvitterande ikonbyte + toast. */
export function KopieraKnapp({
  varde,
  etikett,
  variant = 'ghost',
  storlek = 'icon-sm',
  children,
  className,
}: {
  varde: string
  etikett: string
  variant?: 'ghost' | 'outline' | 'secondary'
  storlek?: 'icon-sm' | 'sm'
  children?: React.ReactNode
  className?: string
}) {
  const [kopierad, setKopierad] = useState(false)

  async function kopiera() {
    try {
      await navigator.clipboard.writeText(varde)
      setKopierad(true)
      toast.success(`${etikett} kopierad`)
      setTimeout(() => setKopierad(false), 1600)
    } catch {
      toast.error('Kunde inte kopiera', { description: 'Webbläsaren nekade åtkomst till urklipp.' })
    }
  }

  const Ikon = kopierad ? CheckIcon : CopyIcon

  return (
    <Button
      variant={variant}
      size={storlek}
      onClick={kopiera}
      aria-label={`Kopiera ${etikett.toLowerCase()}`}
      className={className}
    >
      <Ikon data-icon={children ? 'inline-start' : undefined} className={cn(kopierad && 'text-success')} />
      {children}
    </Button>
  )
}

/** Etikett/värde-par. Grunden för all metadata i portalen – utan ramar. */
export function Faltrad({
  etikett,
  children,
  className,
}: {
  etikett: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {etikett}
      </dt>
      <dd className="text-[13px] leading-relaxed text-text-secondary">{children}</dd>
    </div>
  )
}

/** Diskret sektionsrubrik inuti kort. */
export function Sektionsrubrik({
  children,
  antal,
  atgard,
}: {
  children: React.ReactNode
  antal?: number
  atgard?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[13px] font-semibold">
        {children}
        {typeof antal === 'number' && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {antal}
          </span>
        )}
      </h2>
      {atgard}
    </div>
  )
}

/** Yta som ersätter kort där en ram vore för mycket. */
/**
 * Visas när `useOperativAdminData` inte kunde nå det operativa API:t.
 * I produktion visas ingen tyst demo-/localStorage-fallback – detta
 * meddelande är den enda indikationen till användaren om att listan
 * kan vara ofullständig eller inaktuell.
 */
export function DriftFelBanner({ vidForsokIgen }: { vidForsokIgen: () => void }) {
  return (
    <Alert variant="destructive">
      <TriangleAlertIcon />
      <AlertTitle>Kunde inte hämta senaste data</AlertTitle>
      <AlertDescription>
        Anslutningen till servern misslyckades. Listan kan vara ofullständig eller inaktuell.
      </AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={vidForsokIgen}>
          Försök igen
        </Button>
      </AlertAction>
    </Alert>
  )
}

export function Yta({
  children,
  className,
  niva = 1,
}: {
  children: React.ReactNode
  className?: string
  niva?: 1 | 2
}) {
  return (
    <div
      className={cn(
        'rounded-xl',
        niva === 1 ? 'bg-card' : 'bg-surface-emphasis',
        className,
      )}
    >
      {children}
    </div>
  )
}
