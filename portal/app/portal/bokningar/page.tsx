import type { Metadata } from 'next'
import { Suspense } from 'react'

import { Bokningsvy } from '@/components/portal/bokningar/bokningsvy'

export const metadata: Metadata = {
  title: 'Bokningar',
}

export default function BokningarSida() {
  return (
    <Suspense>
      <Bokningsvy />
    </Suspense>
  )
}
