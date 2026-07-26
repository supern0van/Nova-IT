import {
  CalendarDaysIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  TicketIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'

import type { Behorighet } from '@/lib/auth/demo-auth'

export interface NavPost {
  href: string
  etikett: string
  ikon: LucideIcon
  /** Utan behörigheten döljs posten helt i menyn. */
  kraver?: Behorighet
  /** Exakt matchning istället för prefixmatchning. */
  exakt?: boolean
}

export const navigation: NavPost[] = [
  { href: '/portal', etikett: 'Översikt', ikon: LayoutDashboardIcon, exakt: true },
  { href: '/portal/arenden', etikett: 'Ärenden', ikon: TicketIcon },
  { href: '/portal/kunder', etikett: 'Kunder', ikon: UsersIcon, kraver: 'se_kunder' },
  { href: '/portal/bokningar', etikett: 'Bokningar', ikon: CalendarDaysIcon },
  {
    href: '/portal/installningar',
    etikett: 'Inställningar',
    ikon: SettingsIcon,
    kraver: 'se_installningar',
  },
]

export function arAktiv(href: string, pathname: string, exakt?: boolean) {
  if (exakt) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}
