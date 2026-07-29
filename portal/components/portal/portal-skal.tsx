'use client'

import { MenuIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { NovaMark } from '@/components/nova-mark'
import { Sidomeny } from '@/components/portal/sidomeny'
import { SessionStatus } from '@/components/portal/session-status'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const KOMPRIMERAD_NYCKEL = 'nova-it.sidomeny-komprimerad'

/**
 * Portalens gemensamma skal: fast sidomeny på dator, panel på mobil.
 * Sidomenyns läge sparas mellan sidbyten och sessioner.
 */
export function PortalSkal({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [komprimerad, setKomprimerad] = useState(false)
  const [panelOppen, setPanelOppen] = useState(false)

  useEffect(() => {
    setKomprimerad(window.localStorage.getItem(KOMPRIMERAD_NYCKEL) === '1')
  }, [])

  // Stäng mobilpanelen vid navigering.
  useEffect(() => {
    setPanelOppen(false)
  }, [pathname])

  function vaxla() {
    setKomprimerad((v) => {
      const nästa = !v
      window.localStorage.setItem(KOMPRIMERAD_NYCKEL, nästa ? '1' : '0')
      return nästa
    })
  }

  return (
    <div className="flex min-h-svh bg-background">
      <SessionStatus />
      {/* Sidomeny – dator */}
      <aside
        className={cn(
          'sticky top-0 hidden h-svh shrink-0 transition-[width] duration-200 ease-out lg:block',
          komprimerad ? 'w-[60px]' : 'w-[228px]',
        )}
      >
        <Sidomeny komprimerad={komprimerad} vidVaxla={vaxla} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Toppfält – endast mobil/surfplatta */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 bg-sidebar/95 px-4 backdrop-blur lg:hidden">
          <Sheet open={panelOppen} onOpenChange={setPanelOppen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  aria-label="Öppna menyn"
                  className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                >
                  <MenuIcon className="size-5" />
                </button>
              }
            />
            <SheetContent side="left" className="w-[248px] p-0">
              <SheetTitle className="sr-only">Portalnavigation</SheetTitle>
              <Sidomeny komprimerad={false} vidNavigering={() => setPanelOppen(false)} iPanel />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <NovaMark className="size-7" />
            <span className="text-sm font-semibold">Nova IT</span>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
