// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Kund } from '@/lib/types'

const kan = vi.fn().mockReturnValue(true)
const push = vi.fn()
const taBortKund = vi.fn()

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => ({ anvandare: { id: 'user-1', namn: 'Admin Nova' }, kan }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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
  taBortKund,
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

describe('KundProfil – ta bort kund', () => {
  afterEach(() => {
    mockState.db.kunder = [kund]
    mockState.db.arenden = []
    kan.mockReturnValue(true)
    taBortKund.mockReset()
    push.mockReset()
    cleanup()
  })

  it('döljer knappen för roller utan ta_bort_kund', () => {
    kan.mockImplementation((behorighet: string) => behorighet !== 'ta_bort_kund')
    render(<KundProfil kundId="kund-1" />)

    expect(screen.queryByRole('button', { name: /Ta bort kund/ })).toBeNull()
  })

  it('varnar om kunden har öppna ärenden, tar bort och navigerar vid bekräftelse', async () => {
    mockState.db.arenden = [
      {
        id: 'arende-1',
        arendenummer: 'NIT-1',
        rubrik: 'Test',
        kundId: 'kund-1',
        kundNamn: kund.namn,
        kundtyp: 'privatperson',
        epost: kund.epost,
        telefon: kund.telefon,
        kategori: 'installation',
        underkategori: '',
        status: 'ny',
        prioritet: 'normal',
        ansvarigId: null,
        kanal: 'telefon',
        beskrivning: 'Test',
        bilagor: [],
        skapad: new Date().toISOString(),
        uppdaterad: new Date().toISOString(),
      },
    ] as unknown as never[]
    taBortKund.mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<KundProfil kundId="kund-1" />)

    await user.click(screen.getByRole('button', { name: /Ta bort kund/ }))
    expect(screen.getByText(/1 öppna ärenden/)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Ta bort permanent' }))

    expect(taBortKund).toHaveBeenCalledWith('kund-1')
    expect(push).toHaveBeenCalledWith('/portal/kunder')
  })
})
