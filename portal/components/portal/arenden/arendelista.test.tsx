// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

const taBortArenden = vi.fn()

vi.mock('@/lib/store', () => ({
  manuellaKanaler: ['telefon', 'e-post'],
  skapaArende: vi.fn(),
  taBortArenden,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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

describe('Arendelista – alltid synlig kö för nya ärenden', () => {
  afterEach(() => {
    mockState.db.arenden = [arende]
    mockState.fel = false
    cleanup()
  })

  it('visar "inga nya ärenden"-läget när inget ärende har status "ny"', () => {
    mockState.db.arenden = [arende]

    render(<Arendelista />)

    expect(screen.getByText('Inga nya, obehandlade ärenden just nu.')).toBeTruthy()
  })

  it('listar nya ärenden i kön oavsett vad statusfiltret på huvudlistan står på', () => {
    const nyttArende: Arende = { ...arende, id: 'arende-2', arendenummer: 'NIT-2402', status: 'ny' }
    mockState.db.arenden = [arende, nyttArende]

    render(<Arendelista />)

    expect(screen.getByText('Nya ärenden')).toBeTruthy()
    // NIT-2402 syns både i kön och i huvudlistan (standardfiltret "Alla
    // statusar" döljer ingenting) - därför getAllByText, inte getByText.
    expect(screen.getAllByText('NIT-2402').length).toBe(2)
    // Huvudlistan visar fortfarande det icke-nya ärendet också.
    expect(screen.getByText('NIT-2401')).toBeTruthy()
  })
})

describe('Arendelista – klickbara kolumnrubriker', () => {
  afterEach(() => {
    mockState.db.arenden = [arende]
    cleanup()
  })

  it('sorterar om när man klickar en kolumnrubrik, och byter riktning vid nästa klick', async () => {
    const annanKund: Arende = { ...arende, id: 'arende-2', arendenummer: 'NIT-2402', kundNamn: 'Anna Andersson' }
    mockState.db.arenden = [arende, annanKund]
    const user = userEvent.setup()

    render(<Arendelista />)

    const rader = () => screen.getAllByRole('row').slice(1) // hoppa över rubrikraden
    // Standard (uppdaterad, desc): båda har samma uppdaterad-tid i fixturerna,
    // så ordningen är stabil från listan som skickas in.

    await user.click(screen.getByRole('button', { name: /Kund/ }))
    expect(rader()[0].textContent).toContain('Anna Andersson')

    await user.click(screen.getByRole('button', { name: /Kund/ }))
    expect(rader()[0].textContent).toContain('Birgitta Sandell')
  })
})

describe('Arendelista – bulk-borttagning', () => {
  afterEach(() => {
    mockState.db.arenden = [arende]
    kan.mockReturnValue(true)
    taBortArenden.mockReset()
    cleanup()
  })

  it('döljer kryssrutor och borttagningsknapp för roller utan ta_bort_arende', () => {
    kan.mockImplementation((behorighet: string) => behorighet !== 'ta_bort_arende')
    render(<Arendelista />)

    expect(screen.queryAllByRole('checkbox').length).toBe(0)
  })

  it('markerar ärenden och tar bort de valda', async () => {
    const arende2: Arende = { ...arende, id: 'arende-2', arendenummer: 'NIT-2402' }
    mockState.db.arenden = [arende, arende2]
    taBortArenden.mockResolvedValue(['arende-1'])
    const user = userEvent.setup()

    render(<Arendelista />)

    const kryssrutor = screen.getAllByRole('checkbox')
    // Första kryssrutan är "välj alla" i rubriken, resten är radkryssrutor.
    await user.click(kryssrutor[1])

    expect(screen.getByRole('button', { name: /Ta bort valda \(1\)/ })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /Ta bort valda/ }))
    await user.click(screen.getByRole('button', { name: 'Ta bort permanent' }))

    expect(taBortArenden).toHaveBeenCalledWith(['arende-1'])
  })

  it('rensar markeringen av ärenden som filtreras bort av sökningen, så de inte kan raderas av misstag', async () => {
    const arende2: Arende = { ...arende, id: 'arende-2', arendenummer: 'NIT-2402', rubrik: 'Annat ärende' }
    mockState.db.arenden = [arende, arende2]
    const user = userEvent.setup()

    render(<Arendelista />)

    const kryssrutor = screen.getAllByRole('checkbox')
    await user.click(kryssrutor[1])
    expect(screen.getByRole('button', { name: /Ta bort valda \(1\)/ })).toBeTruthy()

    // Sök på något som bara matchar det ANDRA ärendet - det markerade
    // ärendet (arende-1) blir osynligt i tabellen.
    await user.type(screen.getByPlaceholderText('Sök ärendenummer, kund eller text'), 'NIT-2402')

    expect(screen.queryByRole('button', { name: /Ta bort valda/ })).toBeNull()
  })

  it('behåller markeringen av ärenden som fortfarande är synliga efter en sökning', async () => {
    const arende2: Arende = { ...arende, id: 'arende-2', arendenummer: 'NIT-2402', rubrik: 'Annat ärende' }
    mockState.db.arenden = [arende, arende2]
    const user = userEvent.setup()

    render(<Arendelista />)

    const kryssrutor = screen.getAllByRole('checkbox')
    await user.click(kryssrutor[1])
    expect(screen.getByRole('button', { name: /Ta bort valda \(1\)/ })).toBeTruthy()

    // Sök på något som matchar BÅDA ärendena - det markerade ärendet
    // (arende-1) är fortfarande synligt och ska förbli markerat.
    await user.type(screen.getByPlaceholderText('Sök ärendenummer, kund eller text'), 'Test')

    expect(screen.getByRole('button', { name: /Ta bort valda \(1\)/ })).toBeTruthy()
  })
})
