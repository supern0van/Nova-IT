// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Arendekategori, Kund } from '@/lib/types'

const anvandare = {
  id: 'user-1',
  namn: 'Admin Nova',
  epost: 'admin@nova-it.se',
  roll: 'administrator' as const,
  initialer: 'AN',
  titel: 'Administratör',
  aktiv: true,
}

const push = vi.fn()
const skapaArende = vi.fn()

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => ({ anvandare }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/store', () => ({
  manuellaKanaler: ['telefon', 'e-post'],
  skapaArende,
}))

let ArendeDialog: typeof import('@/components/portal/arenden/arende-dialog').ArendeDialog

beforeAll(async () => {
  ;({ ArendeDialog } = await import('@/components/portal/arenden/arende-dialog'))
})

const kunder: Kund[] = [
  {
    id: 'k-1',
    namn: 'Birgitta Sandell',
    kundtyp: 'privatperson',
    epost: 'birgitta@exempel.se',
    telefon: '070-000 00 00',
    adress: '',
    ort: '',
    senasteKontakt: new Date().toISOString(),
    skapad: new Date().toISOString(),
  },
]

const kategorier: Arendekategori[] = [
  {
    id: 'kat-1',
    namn: 'Datorer och vardags-IT',
    nyckel: 'datorer_vardags_it',
    underkategorier: [],
    standardPrioritet: 'normal',
    aktiv: true,
  },
]

function renderaDialog() {
  const setOppen = vi.fn()
  render(
    <ArendeDialog
      oppen
      setOppen={setOppen}
      kunder={kunder}
      kategorier={kategorier}
      forvaldKundId="k-1"
    />,
  )
  return { setOppen }
}

describe('ArendeDialog – validering speglar server-constraints', () => {
  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('nekar rubrik kortare än 3 tecken', async () => {
    const user = userEvent.setup()
    renderaDialog()

    await user.type(screen.getByLabelText('Rubrik'), 'Ok')
    await user.click(screen.getByText('Välj kategori'))
    await user.click(await screen.findByRole('option', { name: 'Datorer och vardags-IT' }))
    await user.type(screen.getByLabelText('Beskrivning'), 'Beskrivning som räcker.')
    await user.click(screen.getByRole('button', { name: 'Registrera ärende' }))

    expect(await screen.findByText('Rubriken är för kort (minst 3 tecken).')).toBeTruthy()
    expect(skapaArende).not.toHaveBeenCalled()
  })

  it('nekar rubrik längre än 180 tecken', async () => {
    const user = userEvent.setup()
    renderaDialog()

    fireEvent.change(screen.getByLabelText('Rubrik'), { target: { value: 'A'.repeat(181) } })
    await user.click(screen.getByText('Välj kategori'))
    await user.click(await screen.findByRole('option', { name: 'Datorer och vardags-IT' }))
    await user.type(screen.getByLabelText('Beskrivning'), 'Beskrivning som räcker.')
    await user.click(screen.getByRole('button', { name: 'Registrera ärende' }))

    expect(await screen.findByText('Rubriken är för lång (max 180 tecken).')).toBeTruthy()
    expect(skapaArende).not.toHaveBeenCalled()
  })

  it('nekar beskrivning kortare än 5 tecken', async () => {
    const user = userEvent.setup()
    renderaDialog()

    await user.type(screen.getByLabelText('Rubrik'), 'Giltig rubrik')
    await user.click(screen.getByText('Välj kategori'))
    await user.click(await screen.findByRole('option', { name: 'Datorer och vardags-IT' }))
    await user.type(screen.getByLabelText('Beskrivning'), 'Ok.')
    await user.click(screen.getByRole('button', { name: 'Registrera ärende' }))

    expect(
      await screen.findByText('Beskrivningen är för kort (minst 5 tecken).'),
    ).toBeTruthy()
    expect(skapaArende).not.toHaveBeenCalled()
  })

  it('sparar när alla fält är giltiga', async () => {
    const user = userEvent.setup()
    skapaArende.mockResolvedValue({ id: 'a-ny', arendenummer: 'NIT-9999', rubrik: 'Giltig rubrik' })
    renderaDialog()

    await user.type(screen.getByLabelText('Rubrik'), 'Giltig rubrik')
    await user.click(screen.getByText('Välj kategori'))
    await user.click(await screen.findByRole('option', { name: 'Datorer och vardags-IT' }))
    await user.type(screen.getByLabelText('Beskrivning'), 'Beskrivning som räcker.')
    await user.click(screen.getByRole('button', { name: 'Registrera ärende' }))

    expect(skapaArende).toHaveBeenCalledTimes(1)
  })

  it('visar ett begripligt felmeddelande om API:t kastar', async () => {
    const user = userEvent.setup()
    skapaArende.mockRejectedValue(new Error('Kunde inte spara i den operativa databasen.'))
    renderaDialog()

    await user.type(screen.getByLabelText('Rubrik'), 'Giltig rubrik')
    await user.click(screen.getByText('Välj kategori'))
    await user.click(await screen.findByRole('option', { name: 'Datorer och vardags-IT' }))
    await user.type(screen.getByLabelText('Beskrivning'), 'Beskrivning som räcker.')
    await user.click(screen.getByRole('button', { name: 'Registrera ärende' }))

    expect(toast.error).toHaveBeenCalledWith('Kunde inte registrera ärendet', {
      description: 'Kunde inte spara i den operativa databasen.',
    })
    expect(push).not.toHaveBeenCalled()
  })
})
