// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Arende, Bokning, Kund } from '@/lib/types'

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
const avbokaBokning = vi.fn()

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => ({ anvandare, kan }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/auth/demo-auth', () => ({
  anvandarNamn: () => 'Ej tilldelad',
  listaTilldelningsbara: () => [],
}))

vi.mock('@/lib/store', () => ({
  avbokaBokning,
  bokningTyper: ['hembesok', 'distanssupport', 'verkstadsbesok', 'telefonkontakt'],
  skapaBokning: vi.fn(),
  uppdateraBokning: vi.fn(),
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

const bokning: Bokning = {
  id: 'bok-1',
  arendeId: 'arende-1',
  kundId: 'kund-1',
  kundNamn: 'Birgitta Sandell',
  typ: 'hembesok',
  status: 'planerad',
  datum: '2026-07-30',
  tid: '09:00',
  langdMinuter: 60,
  tekniker: 'user-1',
  plats: 'Loviselundsvägen 42, Hässelby',
}

vi.mock('@/hooks/use-operativ-admin-data', () => ({
  useOperativAdminData: () => ({
    db: {
      kunder: [kund],
      arenden: [arende],
      bokningar: [bokning],
      meddelanden: [],
      aktiviteter: [],
      kundanteckningar: [],
      standardsvar: [],
    },
    laddar: false,
    fel: false,
    uppdatera: vi.fn(),
  }),
}))

let ArendeDetalj: typeof import('@/components/portal/arende/arende-detalj').ArendeDetalj

beforeAll(async () => {
  ;({ ArendeDetalj } = await import('@/components/portal/arende/arende-detalj'))
})

async function oppnaAvbokaDialog(user: ReturnType<typeof userEvent.setup>) {
  render(<ArendeDetalj arendeId="arende-1" />)
  await user.click(screen.getByRole('button', { name: /Avboka/ }))
  await user.click(screen.getByRole('button', { name: 'Avboka' }))
}

describe('ArendeDetalj – avbokning av bokning', () => {
  afterEach(() => {
    vi.clearAllMocks()
    kan.mockReturnValue(true)
    cleanup()
  })

  it('visar ett begripligt fel om avbokaBokning kastar', async () => {
    const user = userEvent.setup()
    avbokaBokning.mockRejectedValue(new Error('Kunde inte spara i den operativa databasen.'))

    await oppnaAvbokaDialog(user)

    expect(toast.error).toHaveBeenCalledWith('Kunde inte avboka bokningen', {
      description: 'Kunde inte spara i den operativa databasen.',
    })
  })

  it('avbokar bokningen vid lyckat anrop', async () => {
    const user = userEvent.setup()
    avbokaBokning.mockResolvedValue(undefined)

    await oppnaAvbokaDialog(user)

    expect(avbokaBokning).toHaveBeenCalledWith('bok-1', 'Admin Nova')
    expect(toast.success).toHaveBeenCalledWith('Bokningen avbokades', {
      description: 'Kunden meddelas inte automatiskt ännu.',
    })
  })
})
