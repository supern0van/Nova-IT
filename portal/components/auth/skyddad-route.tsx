'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { NovaMark } from '@/components/nova-mark'
import type { Behorighet } from '@/lib/auth/demo-auth'

/**
 * Skyddar portalens sidor.
 *
 * OBS: skyddet sker här enbart på klienten, vilket räcker för en demo men inte
 * för produktion. Vid riktig autentisering ska detta kompletteras med kontroll
 * i `proxy.ts` (Next.js 16) eller i en server-layout, så att ingen skyddad data
 * någonsin skickas till en oautentiserad klient.
 */
export function SkyddadRoute({
  children,
  kraverBehorighet,
}: {
  children: React.ReactNode
  kraverBehorighet?: Behorighet
}) {
  const router = useRouter()
  const { anvandare, initierar, kan } = useAuth()

  useEffect(() => {
    if (initierar) return
    if (!anvandare) {
      router.replace('/logga-in')
      return
    }
    if (kraverBehorighet && !kan(kraverBehorighet)) {
      router.replace('/portal')
    }
  }, [initierar, anvandare, kraverBehorighet, kan, router])

  if (initierar || !anvandare || (kraverBehorighet && !kan(kraverBehorighet))) {
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
