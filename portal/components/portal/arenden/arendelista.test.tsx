// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Arende } from '@/lib/types'

const anvandare = {
  id: 'user-1',
  namn: 'Admin Nova',
  epost: 'admin@nova-it.se',
  roll: 'administrator' as const,
  initialer: 'AN',
  titel: 'Administratör',
  aktiv: true,
}
const kan = vi.fn().mockReturnValue(true)
const push = vi.fn()

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => ({ anvandare, kan }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/store', () => ({
  manuellaKanaler: ['telefon', 'e-post'],
  skapaArende: vi.fn(),
}))

const arende: Arende = {
  id: 'arende-1',
  arendenummer: 'NIT-2401',
  rubrik: 'Test',
  kundId: 'kund-1',
  kundNamn: 'Birgitta Sandell',
  kundtyp: 'privatperson',
  epost: 'test@example.com',
  telefon: '0700000000',
  kategori: 'installation',
  underkategori: '',
  status: 'pagaende',
  prioritet: 'normal',
  ansvarigId: null,
  kanal: 'telefon',
  beskrivning: 'Testbeskrivning',
  bilagor: [],
  skapad: '2026-07-28T00:00:00.000Z',
  uppdaterad: '2026-07-28T00:00:00.000Z',
}

const mockState: {
  db: { kunder: never[]; arenden: Arende[]; kategorier: never[]; personal: never[] }
  laddar: boolean
  fel: boolean
} = {
  db: { kunder: [], arenden: [arende], kategorier: [], personal: [] },
  laddar: false,
  fel: false,
}

vi.mock('@/hooks/use-operativ-admin-data', () => ({
  useOperativAdminData: () => ({ ...mockState, uppdatera: vi.fn() }),
}))

let Arendelista: typeof import('@/components/portal/arenden/arendelista').Arendelista

beforeAll(async () => {
  ;({ Arendelista } = await import('@/components/portal/arenden/arendelista'))
})

describe('Arendelista – skiljer "inga ärenden" från "kunde inte hämtas"', () => {
  afterEach(() => {
    mockState.db.arenden = [arende]
    mockState.fel = false
    cleanup()
  })

  it('visar det vanliga tomma läget när listan genuint är tom', () => {
    mockState.db.arenden = []
    mockState.fel = false

    render(<Arendelista />)

    expect(screen.getByText('Inga ärenden ännu')).toBeTruthy()
    expect(screen.queryByText(/Kan inte visa ärenden just nu/)).toBeNull()
  })

  it('visar ett hämtningsfel – inte "inga ärenden" – när API-anropet misslyckades', () => {
    mockState.db.arenden = []
    mockState.fel = true

    render(<Arendelista />)

    expect(screen.getByText('Kan inte visa ärenden just nu')).toBeTruthy()
    expect(screen.queryByText('Inga ärenden ännu')).toBeNull()
  })

  it('visar ärendelistan normalt när data finns', () => {
    render(<Arendelista />)

    expect(screen.getByText('NIT-2401')).toBeTruthy()
  })
})
