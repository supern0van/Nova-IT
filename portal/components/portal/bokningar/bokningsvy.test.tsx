// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Bokning, Kund } from '@/lib/types'

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

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/store', () => ({
  avbokaBokning,
  bokningTyper: ['hembesok', 'distanssupport', 'verkstadsbesok', 'telefonkontakt'],
  skapaBokning: vi.fn(),
  uppdateraBokning: vi.fn(),
}))

function idagIso() {
  const d = new Date()
  const ar = d.getFullYear()
  const manad = String(d.getMonth() + 1).padStart(2, '0')
  const dag = String(d.getDate()).padStart(2, '0')
  return `${ar}-${manad}-${dag}`
}

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

const bokning: Bokning = {
  id: 'bok-1',
  kundId: 'kund-1',
  kundNamn: 'Birgitta Sandell',
  typ: 'hembesok',
  status: 'planerad',
  datum: idagIso(),
  tid: '09:00',
  langdMinuter: 60,
  tekniker: 'user-1',
  plats: 'Loviselundsvägen 42, Hässelby',
}

vi.mock('@/hooks/use-operativ-admin-data', () => ({
  useOperativAdminData: () => ({
    db: {
      kunder: [kund],
      arenden: [],
      bokningar: [bokning],
      meddelanden: [],
      aktiviteter: [],
      kundanteckningar: [],
      standardsvar: [],
      personal: [],
    },
    laddar: false,
    fel: false,
    uppdatera: vi.fn(),
  }),
}))

let Bokningsvy: typeof import('@/components/portal/bokningar/bokningsvy').Bokningsvy

beforeAll(async () => {
  ;({ Bokningsvy } = await import('@/components/portal/bokningar/bokningsvy'))
})

async function oppnaAvbokaDialog(user: ReturnType<typeof userEvent.setup>) {
  render(<Bokningsvy />)
  await user.click(screen.getByRole('button', { name: /Avboka/ }))
  await user.click(screen.getByRole('button', { name: 'Avboka' }))
}

describe('Bokningsvy – avbokning av bokning', () => {
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

  it('förhindrar dubbla avbokningsförsök av samma bokning', async () => {
    const user = userEvent.setup()
    let losUpp: (() => void) | undefined
    avbokaBokning.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          losUpp = resolve
        }),
    )
    render(<Bokningsvy />)

    await user.click(screen.getByRole('button', { name: /Avboka/ }))
    const bekraftaKnapp = screen.getByRole('button', { name: 'Avboka' })
    await user.click(bekraftaKnapp)
    await user.click(bekraftaKnapp)

    expect(avbokaBokning).toHaveBeenCalledTimes(1)
    losUpp?.()
  })
})
