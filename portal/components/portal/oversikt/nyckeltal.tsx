'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Nyckeltal på översikten. Klickbara – varje kort är en genväg till
 * ärendelistan med motsvarande filter förvalt via query-parametrar.
 */
export function Nyckeltal({
  etikett,
  varde,
  ikon: Ikon,
  href,
  ton = 'neutral',
  fotnot,
}: {
  etikett: string
  varde: number
  ikon: LucideIcon
  href: string
  ton?: 'neutral' | 'primar' | 'varning' | 'kritisk' | 'klar'
  fotnot?: string
}) {
  const toner: Record<string, string> = {
    neutral: 'text-muted-foreground bg-muted',
    primar: 'text-primary bg-primary/12',
    varning: 'text-warning bg-warning/12',
    kritisk: 'text-destructive bg-destructive/14',
    klar: 'text-success bg-success/12',
  }

  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl bg-card p-4 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium leading-tight text-muted-foreground">
          {etikett}
        </span>
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105',
            toner[ton],
          )}
        >
          <Ikon className="size-3.5" />
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-tabular text-2xl font-semibold leading-none">{varde}</span>
        {fotnot && <span className="text-[11px] text-muted-foreground">{fotnot}</span>}
      </div>
    </Link>
  )
}

export function NyckeltalSkelett() {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-7 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-10" />
    </div>
  )
}
