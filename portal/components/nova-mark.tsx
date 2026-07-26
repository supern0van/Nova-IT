import { cn } from '@/lib/utils'

/**
 * Nova IT:s varumärkesmärke, återgivet som inline-SVG så att det ärver
 * portalens färger. Formen följer logotypen på nova-it.se: ett "N" i en mjukt
 * rundad kvadrat med en accentpunkt uppe till höger.
 */
export function NovaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Nova IT"
      className={cn('size-8 shrink-0', className)}
    >
      <rect width="64" height="64" rx="14" className="fill-[oklch(0.22_0.03_247)]" />
      <path
        d="M17 45V20.5c0-2.6 2.1-4.7 4.7-4.7 1.3 0 2.5.5 3.4 1.4l15.2 15.2V20.5c0-2.6 2.1-4.7 4.7-4.7s4.7 2.1 4.7 4.7V45c0 2.6-2.1 4.7-4.7 4.7-1.3 0-2.5-.5-3.4-1.4L26.4 33.1V45c0 2.6-2.1 4.7-4.7 4.7S17 47.6 17 45Z"
        className="fill-foreground"
      />
      <circle cx="48" cy="13" r="4.5" className="fill-primary" />
    </svg>
  )
}

/** Logotyp med ordbild – används i sidomeny och på inloggningssidan. */
export function NovaLogotyp({
  className,
  underrubrik = 'Adminportal',
  komprimerad = false,
}: {
  className?: string
  underrubrik?: string
  komprimerad?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <NovaMark className="size-8" />
      {!komprimerad && (
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold leading-tight tracking-tight">
            Nova IT
          </span>
          <span className="truncate text-[10px] font-medium uppercase leading-tight tracking-[0.12em] text-muted-foreground">
            {underrubrik}
          </span>
        </div>
      )}
    </div>
  )
}
