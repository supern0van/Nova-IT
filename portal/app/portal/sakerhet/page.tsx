import type { Metadata } from 'next'

import { SakerhetVy } from '@/components/portal/sakerhet/sakerhet-vy'

export const metadata: Metadata = {
  title: 'Säkerhet',
  description: 'Hantera tvåstegsverifiering för ditt Nova IT-konto.',
}

export default function SakerhetSida() {
  return <SakerhetVy />
}
