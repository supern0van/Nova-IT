import type { Metadata } from 'next'

import { OversiktVy } from '@/components/portal/oversikt/oversikt-vy'

export const metadata: Metadata = {
  title: 'Översikt',
}

export default function OversiktSida() {
  return <OversiktVy />
}
