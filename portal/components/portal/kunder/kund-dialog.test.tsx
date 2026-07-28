// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

const anvandare = {
  id: 'user-1',
  namn: 'Admin Nova',
  epost: 'admin@nova-it.se',
  roll: 'administrator' as const,
  initialer: 'AN',
  titel: 'Administratör',
  aktiv: true,
}

const skapaKund = vi.fn()
const uppdateraKund = vi.fn()

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => ({ anvandare }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/store', () => ({
  skapaKund,
  uppdateraKund,
}))

let KundDialog: typeof import('@/components/portal/kunder/kund-dialog').KundDialog

beforeAll(async () => {
  ;({ KundDialog } = await import('@/components/portal/kunder/kund-dialog'))
})

function renderaDialog() {
  const setOppen = vi.fn()
  render(<KundDialog oppen setOppen={setOppen} />)
  return { setOppen }
}

async function fyllIObligatoriskaFalt(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Namn'), 'Ny Kund')
  await user.type(screen.getByLabelText('E-post'), 'ny.kund@exempel.se')
  await user.type(screen.getByLabelText('Telefon'), '070-123 45 67')
}

describe('KundDialog – validering speglar server-constraints', () => {
  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('nekar namn längre än 160 tecken', async () => {
    const user = userEvent.setup()
    renderaDialog()

    fireEvent.change(screen.getByLabelText('Namn'), { target: { value: 'A'.repeat(161) } })
    await user.type(screen.getByLabelText('E-post'), 'ny.kund@exempel.se')
    await user.type(screen.getByLabelText('Telefon'), '070-123 45 67')
    await user.click(screen.getByRole('button', { name: 'Lägg upp kund' }))

    expect(await screen.findByText('Namnet får vara högst 160 tecken.')).toBeTruthy()
    expect(skapaKund).not.toHaveBeenCalled()
  })

  it('nekar e-post längre än 254 tecken', async () => {
    const user = userEvent.setup()
    renderaDialog()

    await user.type(screen.getByLabelText('Namn'), 'Ny Kund')
    fireEvent.change(screen.getByLabelText('E-post'), {
      target: { value: `${'a'.repeat(250)}@ab.se` },
    })
    await user.type(screen.getByLabelText('Telefon'), '070-123 45 67')
    await user.click(screen.getByRole('button', { name: 'Lägg upp kund' }))

    expect(
      await screen.findByText('E-postadressen måste vara mellan 3 och 254 tecken.'),
    ).toBeTruthy()
    expect(skapaKund).not.toHaveBeenCalled()
  })

  it('nekar ogiltigt e-postformat separat från längdfelet', async () => {
    const user = userEvent.setup()
    renderaDialog()

    await user.type(screen.getByLabelText('Namn'), 'Ny Kund')
    await user.type(screen.getByLabelText('E-post'), 'inte-en-epost')
    await user.type(screen.getByLabelText('Telefon'), '070-123 45 67')
    await user.click(screen.getByRole('button', { name: 'Lägg upp kund' }))

    expect(await screen.findByText('E-postadressen ser inte giltig ut.')).toBeTruthy()
    expect(skapaKund).not.toHaveBeenCalled()
  })

  it('nekar telefonnummer längre än 40 tecken', async () => {
    const user = userEvent.setup()
    renderaDialog()

    await user.type(screen.getByLabelText('Namn'), 'Ny Kund')
    await user.type(screen.getByLabelText('E-post'), 'ny.kund@exempel.se')
    fireEvent.change(screen.getByLabelText('Telefon'), { target: { value: '0'.repeat(41) } })
    await user.click(screen.getByRole('button', { name: 'Lägg upp kund' }))

    expect(await screen.findByText('Telefonnumret får vara högst 40 tecken.')).toBeTruthy()
    expect(skapaKund).not.toHaveBeenCalled()
  })

  it('nekar för korta telefonnummer (färre än sju siffror)', async () => {
    const user = userEvent.setup()
    renderaDialog()

    await user.type(screen.getByLabelText('Namn'), 'Ny Kund')
    await user.type(screen.getByLabelText('E-post'), 'ny.kund@exempel.se')
    await user.type(screen.getByLabelText('Telefon'), '123456')
    await user.click(screen.getByRole('button', { name: 'Lägg upp kund' }))

    expect(
      await screen.findByText('Ange ett telefonnummer med minst sju siffror.'),
    ).toBeTruthy()
    expect(skapaKund).not.toHaveBeenCalled()
  })

  it('nekar verksamhetsnamn längre än 160 tecken', async () => {
    const user = userEvent.setup()
    renderaDialog()

    await user.type(screen.getByLabelText('Namn'), 'Ny Kund')
    await user.click(screen.getByText('Privatperson'))
    await user.click(await screen.findByRole('option', { name: 'Verksamhet' }))

    fireEvent.change(screen.getByLabelText('Fullständigt verksamhetsnamn'), {
      target: { value: 'A'.repeat(161) },
    })
    await user.type(screen.getByLabelText('E-post'), 'ny.kund@exempel.se')
    await user.type(screen.getByLabelText('Telefon'), '070-123 45 67')
    await user.click(screen.getByRole('button', { name: 'Lägg upp kund' }))

    expect(
      await screen.findByText('Verksamhetens namn får vara högst 160 tecken.'),
    ).toBeTruthy()
    expect(skapaKund).not.toHaveBeenCalled()
  })

  it('sparar när alla fält är giltiga', async () => {
    const user = userEvent.setup()
    skapaKund.mockResolvedValue({
      id: 'k-ny',
      namn: 'Ny Kund',
      kundtyp: 'privatperson',
      epost: 'ny.kund@exempel.se',
      telefon: '070-123 45 67',
      adress: '',
      ort: '',
      senasteKontakt: new Date().toISOString(),
      skapad: new Date().toISOString(),
    })
    renderaDialog()

    await fyllIObligatoriskaFalt(user)
    await user.click(screen.getByRole('button', { name: 'Lägg upp kund' }))

    expect(skapaKund).toHaveBeenCalledTimes(1)
  })
})
