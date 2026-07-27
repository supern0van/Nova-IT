import type { Metadata } from 'next'
import { Suspense } from 'react'

import { MfaVy } from '@/components/auth/mfa-vy'

export const metadata: Metadata = {
  title: 'Tvåstegsverifiering',
  description: 'Sätt upp eller verifiera tvåstegsverifiering (TOTP) för Nova IT:s adminportal.',
}

export default function MfaSida() {
  // Suspense krävs av Next.js eftersom MfaVy använder useSearchParams()
  // (för att läsa proxyns `next`-parameter, se lib/supabase/proxy.ts).
  return (
    <Suspense fallback={null}>
      <MfaVy />
    </Suspense>
  )
}
