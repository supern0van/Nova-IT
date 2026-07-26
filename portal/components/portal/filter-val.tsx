'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface FilterAlternativ {
  varde: string
  etikett: string
}

/**
 * Filtermeny som används i ärendelistan, kundlistan och bokningsvyn.
 * Håller alla filter identiska i utseende och beteende, med värdet "alla" som
 * neutralt läge.
 */
export function FilterVal({
  etikett,
  varde,
  vidAndring,
  alternativ,
  className,
  bredd = 'w-[164px]',
}: {
  etikett: string
  varde: string
  vidAndring: (varde: string) => void
  alternativ: FilterAlternativ[]
  className?: string
  bredd?: string
}) {
  const etiketter = Object.fromEntries(alternativ.map((a) => [a.varde, a.etikett]))
  const aktivt = varde !== 'alla'

  return (
    <Select
      items={etiketter}
      value={varde}
      onValueChange={(v) => vidAndring(String(v))}
    >
      <SelectTrigger
        size="sm"
        aria-label={etikett}
        className={cn(
          'justify-between bg-surface-emphasis',
          bredd,
          aktivt ? 'border-primary/40 text-foreground' : 'border-transparent text-muted-foreground',
          className,
        )}
      >
        <SelectValue>
          {(v: string) => (
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="shrink-0 text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
                {etikett}
              </span>
              <span className="truncate text-[13px]">{etiketter[v] ?? 'Alla'}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-[200px]">
        {alternativ.map((a) => (
          <SelectItem key={a.varde} value={a.varde}>
            {a.etikett}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
