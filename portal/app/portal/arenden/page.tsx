import type { Metadata } from 'next'
import { Suspense } from 'react'

import { Arendelista } from '@/components/portal/arenden/arendelista'

export const metadata: Metadata = {
  title: 'Ärenden',
}

export default function ArendenSida() {
  return (
    <Suspense>
      <Arendelista />
    </Suspense>
  )
}
