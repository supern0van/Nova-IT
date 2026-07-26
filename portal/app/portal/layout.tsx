import { SkyddadRoute } from '@/components/auth/skyddad-route'
import { PortalSkal } from '@/components/portal/portal-skal'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <SkyddadRoute>
      <PortalSkal>{children}</PortalSkal>
    </SkyddadRoute>
  )
}
