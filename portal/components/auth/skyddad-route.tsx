'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { NovaMark } from '@/components/nova-mark'
import type { Behorighet } from '@/lib/auth/supabase-auth'

/**
 * Skyddar portalens sidor på klienten.
 *
 * Det faktiska säkerhetsskyddet sker numera på servern, via
 * `portal/middleware.ts` som anropar implementationen i `lib/supabase/proxy.ts`.
 * En oautentiserad klient nekas där redan innan någon route renderas, så ingen
 * skyddad data skickas någonsin till webbläsaren i första hand.
 *
 * Den här komponenten är ett kompletterande UI-lager, inte säkerhetsgränsen:
 * den visar ett laddningsläge medan sessionen läses in på klienten och
 * omdirigerar även den vägen, men den är inte den enda kontrollen.
 */
export function SkyddadRoute({
  children,
  kraverBehorighet,
}: {
  children: React.ReactNode
  kraverBehorighet?: Behorighet
}) {
  const router = useRouter()
  const { anvandare, initierar, kan, laddarRoll } = useAuth()

  useEffect(() => {
    if (initierar) return
    if (!anvandare) {
      router.replace('/logga-in')
      return
    }
    if (kraverBehorighet && laddarRoll) return
    if (kraverBehorighet && !kan(kraverBehorighet)) {
      router.replace('/portal')
    }
  }, [initierar, laddarRoll, anvandare, kraverBehorighet, kan, router])

  if (
    initierar ||
    !anvandare ||
    (kraverBehorighet && laddarRoll) ||
    (kraverBehorighet && !kan(kraverBehorighet))
  ) {
    return <PortalLaddar />
  }

  return <>{children}</>
}

function PortalLaddar() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <NovaMark className="size-10 animate-pulse" />
        <p className="text-sm text-muted-foreground">Läser in portalen…</p>
      </div>
    </div>
  )
}
