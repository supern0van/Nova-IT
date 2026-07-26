import type { Metadata } from 'next'

import { SkyddadRoute } from '@/components/auth/skyddad-route'
import { Kundlista } from '@/components/portal/kunder/kundlista'

export const metadata: Metadata = {
  title: 'Kunder',
}

export default function KunderSida() {
  return (
    <SkyddadRoute kraverBehorighet="se_kunder">
      <Kundlista />
    </SkyddadRoute>
  )
}
