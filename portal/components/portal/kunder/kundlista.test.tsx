// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Kund } from '@/lib/types'

const kan = vi.fn().mockReturnValue(true)
const push = vi.fn()

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => ({ kan }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/store', () => ({
  skapaKund: vi.fn(),
  uppdateraKund: vi.fn(),
}))

const kund: Kund = {
  id: 'kund-1',
  namn: 'Birgitta Sandell',
  kundtyp: 'privatperson',
  epost: 'birgitta@exempel.se',
  telefon: '070-000 00 00',
  adress: 'Loviselundsvägen 42',
  ort: 'Hässelby',
  senasteKontakt: new Date().toISOString(),
  skapad: new Date().toISOString(),
}

const mockState: { db: { kunder: Kund[]; arenden: never[] }; laddar: boolean; fel: boolean } = {
  db: { kunder: [kund], arenden: [] },
  laddar: false,
  fel: false,
}

vi.mock('@/hooks/use-operativ-admin-data', () => ({
  useOperativAdminData: () => ({ ...mockState, uppdatera: vi.fn() }),
}))

let Kundlista: typeof import('@/components/portal/kunder/kundlista').Kundlista

beforeAll(async () => {
  ;({ Kundlista } = await import('@/components/portal/kunder/kundlista'))
})

describe('Kundlista – skiljer "inga kunder" från "kunde inte hämtas"', () => {
  afterEach(() => {
    mockState.db.kunder = [kund]
    mockState.fel = false
    cleanup()
  })

  it('visar det vanliga tomma läget när registret genuint är tomt', () => {
    mockState.db.kunder = []
    mockState.fel = false

    render(<Kundlista />)

    expect(screen.getByText('Inga kunder ännu')).toBeTruthy()
    expect(screen.queryByText(/Kan inte visa kunder just nu/)).toBeNull()
  })

  it('visar ett hämtningsfel – inte "inga kunder" – när API-anropet misslyckades', () => {
    mockState.db.kunder = []
    mockState.fel = true

    render(<Kundlista />)

    expect(screen.getByText('Kan inte visa kunder just nu')).toBeTruthy()
    expect(screen.queryByText('Inga kunder ännu')).toBeNull()
  })

  it('visar kundlistan normalt när data finns', () => {
    render(<Kundlista />)

    expect(screen.getByText('Birgitta Sandell')).toBeTruthy()
  })
})
