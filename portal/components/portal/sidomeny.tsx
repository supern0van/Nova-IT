'use client'

import { PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useAuth } from '@/components/auth/auth-provider'
import { NovaMark } from '@/components/nova-mark'
import { AnvandarMeny } from '@/components/portal/anvandar-meny'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { arAktiv, navigation } from '@/lib/navigation'
import { cn } from '@/lib/utils'

/**
 * Kompakt sidomeny som kan minimeras till enbart ikoner.
 * Poster som användarens roll saknar behörighet till renderas aldrig.
 */
export function Sidomeny({
  komprimerad,
  vidVaxla,
  vidNavigering,
  iPanel = false,
}: {
  komprimerad: boolean
  vidVaxla?: () => void
  vidNavigering?: () => void
  iPanel?: boolean
}) {
  const pathname = usePathname()
  const { kan } = useAuth()

  const poster = navigation.filter((post) => !post.kraver || kan(post.kraver))

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div
        className={cn(
          'flex h-14 shrink-0 items-center gap-2',
          komprimerad ? 'justify-center px-2' : 'px-3.5',
        )}
      >
        <Link
          href="/portal"
          onClick={vidNavigering}
          className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <NovaMark className="size-8" />
          {!komprimerad && (
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-semibold leading-tight">Nova IT</span>
              <span className="truncate text-[10px] font-medium uppercase leading-tight tracking-[0.12em] text-muted-foreground">
                Adminportal
              </span>
            </span>
          )}
        </Link>

        {!komprimerad && vidVaxla && (
          <button
            type="button"
            onClick={vidVaxla}
            aria-label="Minimera sidomenyn"
            className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <PanelLeftCloseIcon className="size-4" />
          </button>
        )}
      </div>

      <nav
        aria-label="Portalnavigation"
        className={cn('flex flex-1 flex-col gap-1 overflow-y-auto py-3', komprimerad ? 'px-2' : 'px-2.5')}
      >
        {poster.map((post) => {
          const aktiv = arAktiv(post.href, pathname, post.exakt)
          const lank = (
            <Link
              key={post.href}
              href={post.href}
              onClick={vidNavigering}
              aria-current={aktiv ? 'page' : undefined}
              className={cn(
                'group relative flex items-center rounded-lg text-[13px] font-medium transition-colors',
                komprimerad ? 'h-9 w-9 justify-center' : 'h-9 gap-2.5 px-2.5',
                aktiv
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
              )}
            >
              {/* Aktiv markering som diskret accentstreck istället för ram. */}
              <span
                className={cn(
                  'absolute left-0 h-5 w-[2px] rounded-r-full bg-primary transition-opacity',
                  aktiv ? 'opacity-100' : 'opacity-0',
                  komprimerad && '-left-2',
                )}
              />
              <post.ikon className={cn('size-4 shrink-0', aktiv && 'text-primary')} />
              {!komprimerad && <span className="truncate">{post.etikett}</span>}
            </Link>
          )

          if (!komprimerad) return lank

          return (
            <Tooltip key={post.href}>
              <TooltipTrigger render={lank} />
              <TooltipContent side="right">{post.etikett}</TooltipContent>
            </Tooltip>
          )
        })}
      </nav>

      <div className={cn('shrink-0 pb-3', komprimerad ? 'px-2' : 'px-2.5')}>
        {komprimerad && vidVaxla && (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={vidVaxla}
                  aria-label="Expandera sidomenyn"
                  className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                >
                  <PanelLeftOpenIcon className="size-4" />
                </button>
              }
            />
            <TooltipContent side="right">Expandera menyn</TooltipContent>
          </Tooltip>
        )}

        <AnvandarMeny komprimerad={komprimerad} iPanel={iPanel} />
      </div>
    </div>
  )
}
