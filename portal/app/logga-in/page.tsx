import type { Metadata } from 'next'
import { Suspense } from 'react'

import { InloggningsVy } from '@/components/auth/inloggnings-vy'

export const metadata: Metadata = {
  title: 'Logga in',
  description: 'Logga in i Nova IT:s adminportal.',
}

export default function LoggaInSida() {
  // Suspense krävs av Next.js eftersom InloggningsVy använder
  // useSearchParams() (för att läsa proxyns `next`-parameter).
  return (
    <Suspense fallback={null}>
      <InloggningsVy />
    </Suspense>
  )
}
