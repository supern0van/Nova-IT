import type { Metadata } from 'next'

import { InloggningsVy } from '@/components/auth/inloggnings-vy'

export const metadata: Metadata = {
  title: 'Logga in',
  description: 'Logga in i Nova IT:s adminportal.',
}

export default function LoggaInSida() {
  return <InloggningsVy />
}
