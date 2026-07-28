// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Kund } from '@/lib/types'

const kan = vi.fn().mockReturnValue(true)

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => ({ anvandare: { id: 'user-1', namn: 'Admin Nova' }, kan }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/lib/store', () => ({
  manuellaKanaler: ['telefon', 'e-post'],
  skapaArende: vi.fn(),
  bokningTyper: ['hembesok', 'distanssupport', 'verkstadsbesok', 'telefonkontakt'],
  skapaBokning: vi.fn(),
  uppdateraBokning: vi.fn(),
  laggTillKundanteckning: vi.fn(),
  uppdateraKundanteckning: vi.fn(),
  taBortKundanteckning: vi.fn(),
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

const uppdatera = vi.fn()
const mockState: {
  db: {
    kunder: Kund[]
    arenden: never[]
    bokningar: never[]
    kundanteckningar: never[]
    kategorier: never[]
    personal: never[]
  }
  laddar: boolean
  fel: boolean
} = {
  db: { kunder: [kund], arenden: [], bokningar: [], kundanteckningar: [], kategorier: [], personal: [] },
  laddar: false,
  fel: false,
}

vi.mock('@/hooks/use-operativ-admin-data', () => ({
  useOperativAdminData: () => ({ ...mockState, uppdatera }),
}))

let KundProfil: typeof import('@/components/portal/kunder/kund-profil').KundProfil

beforeAll(async () => {
  ;({ KundProfil } = await import('@/components/portal/kunder/kund-profil'))
})

describe('KundProfil – skiljer "hittades inte" från "kunde inte hämtas"', () => {
  afterEach(() => {
    mockState.db.kunder = [kund]
    mockState.fel = false
    cleanup()
  })

  it('visar "hittades inte" när kunden genuint saknas i en lyckad läsning', () => {
    mockState.db.kunder = []
    mockState.fel = false

    render(<KundProfil kundId="okant-id" />)

    expect(screen.getByText('Kunden hittades inte')).toBeTruthy()
    expect(screen.queryByText(/Kan inte visa kunden just nu/)).toBeNull()
  })

  it('visar ett hämtningsfel – inte "hittades inte" – när API-anropet misslyckades', () => {
    mockState.db.kunder = []
    mockState.fel = true

    render(<KundProfil kundId="okant-id" />)

    expect(screen.getByText('Kan inte visa kunden just nu')).toBeTruthy()
    expect(screen.queryByText('Kunden hittades inte')).toBeNull()
  })

  it('visar kundprofilen normalt när kunden finns', () => {
    render(<KundProfil kundId="kund-1" />)

    expect(screen.getAllByText('Birgitta Sandell').length).toBeGreaterThan(0)
  })
})
