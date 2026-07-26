import type { Metadata } from 'next'

import { SkyddadRoute } from '@/components/auth/skyddad-route'
import { KundProfil } from '@/components/portal/kunder/kund-profil'

export const metadata: Metadata = {
  title: 'Kundprofil',
}

export default async function KundSida({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <SkyddadRoute kraverBehorighet="se_kunder">
      <KundProfil kundId={id} />
    </SkyddadRoute>
  )
}
