import type { Metadata } from 'next'

import { SkyddadRoute } from '@/components/auth/skyddad-route'
import { InstallningarVy } from '@/components/portal/installningar/installningar-vy'

export const metadata: Metadata = {
  title: 'Inställningar',
}

export default function InstallningarSida() {
  return (
    <SkyddadRoute kraverBehorighet="se_installningar">
      <InstallningarVy />
    </SkyddadRoute>
  )
}
