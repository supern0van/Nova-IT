// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Anvandare, Kund } from '@/lib/types'

const anvandare = {
  id: 'user-1',
  namn: 'Admin Nova',
  epost: 'admin@nova-it.se',
  roll: 'administrator' as const,
  initialer: 'AN',
  titel: 'Administratör',
  aktiv: true,
}

const skapaBokning = vi.fn()
const uppdateraBokning = vi.fn()

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => ({ anvandare }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/store', () => ({
  bokningTyper: ['hembesok', 'distanssupport', 'verkstadsbesok', 'telefonkontakt'],
  skapaBokning,
  uppdateraBokning,
}))

let BokningDialog: typeof import('@/components/portal/bokningar/bokning-dialog').BokningDialog

beforeAll(async () => {
  ;({ BokningDialog } = await import('@/components/portal/bokningar/bokning-dialog'))
})

const personal: Anvandare[] = [
  {
    id: 'user-1',
    namn: 'Admin Nova',
    epost: 'admin@nova-it.se',
    roll: 'administrator',
    initialer: 'AN',
    titel: 'Administratör',
    aktiv: true,
  },
]

const kunder: Kund[] = [
  {
    id: 'kund-1',
    namn: 'Birgitta Sandell',
    kundtyp: 'privatperson',
    epost: 'birgitta@exempel.se',
    telefon: '070-000 00 00',
    adress: 'Loviselundsvägen 42',
    ort: 'Hässelby',
    senasteKontakt: new Date().toISOString(),
    skapad: new Date().toISOString(),
  },
]

function renderaDialog() {
  const setOppen = vi.fn()
  render(<BokningDialog oppen setOppen={setOppen} kunder={kunder} personal={personal} />)
  return { setOppen }
}

describe('BokningDialog – felhantering och dubbelklicksskydd', () => {
  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('visar ett begripligt felmeddelande om skapaBokning kastar', async () => {
    const user = userEvent.setup()
    skapaBokning.mockRejectedValue(new Error('Kunde inte spara i den operativa databasen.'))
    renderaDialog()

    await user.click(screen.getByText('Välj kund'))
    await user.click(await screen.findByRole('option', { name: 'Birgitta Sandell' }))
    await user.click(screen.getByRole('button', { name: 'Skapa bokning' }))

    expect(toast.error).toHaveBeenCalledWith('Kunde inte skapa bokningen', {
      description: 'Kunde inte spara i den operativa databasen.',
    })
  })

  it('skapar bokningen vid giltig indata', async () => {
    const user = userEvent.setup()
    skapaBokning.mockResolvedValue({
      id: 'bok-1',
      kundId: 'kund-1',
      kundNamn: 'Birgitta Sandell',
      typ: 'hembesok',
      status: 'planerad',
      datum: '2026-07-29',
      tid: '09:00',
      langdMinuter: 60,
      tekniker: 'user-1',
      plats: 'Loviselundsvägen 42, Hässelby',
    })
    renderaDialog()

    await user.click(screen.getByText('Välj kund'))
    await user.click(await screen.findByRole('option', { name: 'Birgitta Sandell' }))
    await user.click(screen.getByRole('button', { name: 'Skapa bokning' }))

    expect(skapaBokning).toHaveBeenCalledTimes(1)
  })

  it('förhindrar dubbelklick vid skapande', async () => {
    const user = userEvent.setup()
    let losUpp: (() => void) | undefined
    skapaBokning.mockImplementation(
      () =>
        new Promise((resolve) => {
          losUpp = () =>
            resolve({
              id: 'bok-1',
              kundId: 'kund-1',
              kundNamn: 'Birgitta Sandell',
              typ: 'hembesok',
              status: 'planerad',
              datum: '2026-07-29',
              tid: '09:00',
              langdMinuter: 60,
              tekniker: 'user-1',
              plats: 'Loviselundsvägen 42, Hässelby',
            })
        }),
    )
    renderaDialog()

    await user.click(screen.getByText('Välj kund'))
    await user.click(await screen.findByRole('option', { name: 'Birgitta Sandell' }))
    const knapp = screen.getByRole('button', { name: 'Skapa bokning' })
    await user.click(knapp)
    await user.click(knapp)

    expect(skapaBokning).toHaveBeenCalledTimes(1)
    losUpp?.()
  })

  it('nekar att spara utan vald kund', async () => {
    const user = userEvent.setup()
    renderaDialog()

    await user.click(screen.getByRole('button', { name: 'Skapa bokning' }))

    expect(await screen.findByText('Välj vilken kund bokningen gäller.')).toBeTruthy()
    expect(skapaBokning).not.toHaveBeenCalled()
  })
})
