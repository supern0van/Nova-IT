// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Arende, Kund } from '@/lib/types'

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
const andraStatus = vi.fn()
const andraPrioritet = vi.fn()
const tilldelaArende = vi.fn()
const markeraSomLost = vi.fn()

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => ({ anvandare, kan }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const skickaNyaInloggningsuppgifter = vi.fn()
const hamtaKundportalStatus = vi.fn().mockResolvedValue(null)

vi.mock('@/lib/store', () => ({
  andraStatus,
  andraPrioritet,
  tilldelaArende,
  markeraSomLost,
  skickaNyaInloggningsuppgifter,
  hamtaKundportalStatus,
}))

let ArendeAtgarder: typeof import('@/components/portal/arende/arende-atgarder').ArendeAtgarder

beforeAll(async () => {
  ;({ ArendeAtgarder } = await import('@/components/portal/arende/arende-atgarder'))
})

const arende: Arende = {
  id: 'arende-1',
  arendenummer: 'NIT-2401',
  rubrik: 'Test',
  kundId: 'kund-1',
  kundNamn: 'Nova Test',
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

const kund: Kund = {
  id: 'kund-1',
  namn: 'Nova Test',
  kundtyp: 'privatperson',
  epost: 'test@example.com',
  telefon: '0700000000',
  adress: 'Testgatan 1',
  ort: 'Stockholm',
  senasteKontakt: '2026-07-28T00:00:00.000Z',
  skapad: '2026-07-28T00:00:00.000Z',
  kontaktUppdateringEpost: true,
  kontaktUppdateringSms: true,
  kontaktKlartEpost: true,
  kontaktKlartSms: true,
}

describe('ArendeAtgarder – SMS-knapp och kontaktpreferenser', () => {
  afterEach(() => {
    vi.clearAllMocks()
    kan.mockReturnValue(true)
    hamtaKundportalStatus.mockResolvedValue(null)
    cleanup()
  })

  it('visar en låst, inaktiv knapp med förklarande tooltip om kunden opt:at ut ur SMS', async () => {
    const user = userEvent.setup()
    render(
      <ArendeAtgarder
        arende={arende}
        personal={[]}
        kund={{ ...kund, kontaktKlartSms: false }}
        vidBoka={vi.fn()}
      />,
    )

    const knapp = screen.getByRole('button', { name: /SMS: klart för upphämtning/ })
    expect((knapp as HTMLButtonElement).disabled).toBe(true)

    await user.hover(knapp)
    expect(await screen.findByText('Kunden har valt att inte ta emot SMS')).toBeTruthy()
  })

  it('tillåter SMS som vanligt när kunden inte opt:at ut', async () => {
    render(<ArendeAtgarder arende={arende} personal={[]} kund={kund} vidBoka={vi.fn()} />)

    const knapp = screen.getByRole('button', { name: /SMS: klart för upphämtning/ })
    expect((knapp as HTMLButtonElement).disabled).toBe(false)
  })

  it('tillåter SMS som vanligt om kunddata ännu inte hunnit läsas in (kund saknas)', async () => {
    render(<ArendeAtgarder arende={arende} personal={[]} vidBoka={vi.fn()} />)

    const knapp = screen.getByRole('button', { name: /SMS: klart för upphämtning/ })
    expect((knapp as HTMLButtonElement).disabled).toBe(false)
  })

  it('visar "Skicka nya inloggningsuppgifter" för konton med redigera_kund', () => {
    render(<ArendeAtgarder arende={arende} personal={[]} kund={kund} vidBoka={vi.fn()} />)

    expect(
      screen.getByRole('button', { name: 'Skicka nya inloggningsuppgifter' }),
    ).toBeTruthy()
  })

  it('döljer "Skicka nya inloggningsuppgifter" utan redigera_kund', () => {
    kan.mockImplementation((behorighet: string) => behorighet !== 'redigera_kund')
    render(<ArendeAtgarder arende={arende} personal={[]} kund={kund} vidBoka={vi.fn()} />)

    expect(
      screen.queryByRole('button', { name: 'Skicka nya inloggningsuppgifter' }),
    ).toBeNull()
  })

  it('skickar nya inloggningsuppgifter efter bekräftelse', async () => {
    const user = userEvent.setup()
    skickaNyaInloggningsuppgifter.mockResolvedValue({
      kontoSkapat: false,
      kontoAterstallt: true,
      utskickSkickat: true,
    })
    render(<ArendeAtgarder arende={arende} personal={[]} kund={kund} vidBoka={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Skicka nya inloggningsuppgifter' }))
    await user.click(screen.getByRole('button', { name: 'Skicka' }))

    expect(skickaNyaInloggningsuppgifter).toHaveBeenCalledWith('arende-1', 'Admin Nova')
    expect(toast.success).toHaveBeenCalledWith('Nytt lösenord skickat till kunden')
  })

  it('visar kundportalstatus när den hämtats ("inget konto ännu")', async () => {
    hamtaKundportalStatus.mockResolvedValue({
      kontoFinns: false,
      masteBytaLosenord: null,
      senastInloggad: null,
    })
    render(<ArendeAtgarder arende={arende} personal={[]} kund={kund} vidBoka={vi.fn()} />)

    expect(hamtaKundportalStatus).toHaveBeenCalledWith('kund-1')
    expect(await screen.findByText('Kundportal: inget konto ännu')).toBeTruthy()
  })

  it('visar senaste inloggningsdatum när kunden loggat in', async () => {
    hamtaKundportalStatus.mockResolvedValue({
      kontoFinns: true,
      masteBytaLosenord: false,
      senastInloggad: '2026-08-01T10:00:00.000Z',
    })
    render(<ArendeAtgarder arende={arende} personal={[]} kund={kund} vidBoka={vi.fn()} />)

    expect(await screen.findByText(/Kundportal: inloggad senast/)).toBeTruthy()
  })

  it('visar ingen statusrad utan redigera_kund', () => {
    kan.mockImplementation((behorighet: string) => behorighet !== 'redigera_kund')
    render(<ArendeAtgarder arende={arende} personal={[]} kund={kund} vidBoka={vi.fn()} />)

    expect(hamtaKundportalStatus).not.toHaveBeenCalled()
    expect(screen.queryByTestId('kundportal-status')).toBeNull()
  })
})

describe('ArendeAtgarder – felhantering och dubbelklicksskydd', () => {
  afterEach(() => {
    vi.clearAllMocks()
    kan.mockReturnValue(true)
    hamtaKundportalStatus.mockResolvedValue(null)
    cleanup()
  })

  it('kräver bekräftelse innan ärendet markeras som löst', async () => {
    const user = userEvent.setup()
    render(<ArendeAtgarder arende={arende} personal={[]} vidBoka={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Markera som löst' }))

    expect(screen.getByText('Markera ärendet som löst?')).toBeTruthy()
    expect(markeraSomLost).not.toHaveBeenCalled()
  })

  it('avbryter utan att markera ärendet som löst', async () => {
    const user = userEvent.setup()
    render(<ArendeAtgarder arende={arende} personal={[]} vidBoka={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Markera som löst' }))
    await user.click(screen.getByRole('button', { name: 'Avbryt' }))

    expect(markeraSomLost).not.toHaveBeenCalled()
    expect(screen.queryByText('Markera ärendet som löst?')).toBeNull()
  })

  it('visar ett begripligt fel och låser inte upp knappen permanent om markeraSomLost kastar', async () => {
    const user = userEvent.setup()
    markeraSomLost.mockRejectedValue(new Error('Kunde inte spara i den operativa databasen.'))
    render(<ArendeAtgarder arende={arende} personal={[]} vidBoka={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Markera som löst' }))
    await user.click(screen.getByRole('button', { name: 'Markera som löst' }))

    expect(toast.error).toHaveBeenCalledWith('Kunde inte markera ärendet som löst', {
      description: 'Kunde inte spara i den operativa databasen.',
    })
    // Knappen ska inte förbli permanent inaktiverad efter ett misslyckat försök.
    const knapp = screen.getByRole('button', { name: 'Markera som löst' })
    expect((knapp as HTMLButtonElement).disabled).toBe(false)
  })

  it('markerar ärendet som löst vid lyckat anrop', async () => {
    const user = userEvent.setup()
    markeraSomLost.mockResolvedValue(undefined)
    render(<ArendeAtgarder arende={arende} personal={[]} vidBoka={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Markera som löst' }))
    await user.click(screen.getByRole('button', { name: 'Markera som löst' }))

    expect(markeraSomLost).toHaveBeenCalledWith('arende-1', 'Admin Nova')
    expect(toast.success).toHaveBeenCalledWith('Ärendet är markerat som löst')
  })

  it('förhindrar dubbelklick – markeraSomLost anropas bara en gång', async () => {
    const user = userEvent.setup()
    let losUpp: (() => void) | undefined
    markeraSomLost.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          losUpp = resolve
        }),
    )
    render(<ArendeAtgarder arende={arende} personal={[]} vidBoka={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Markera som löst' }))
    const bekraftaKnapp = screen.getByRole('button', { name: 'Markera som löst' })
    await user.click(bekraftaKnapp)
    await user.click(bekraftaKnapp)

    expect(markeraSomLost).toHaveBeenCalledTimes(1)
    losUpp?.()
  })

  it('döljer ansvarig-väljaren och visar bara namnet för konton utan tilldela_arende', () => {
    kan.mockImplementation((behorighet: string) => behorighet !== 'tilldela_arende')
    render(<ArendeAtgarder arende={arende} personal={[]} vidBoka={vi.fn()} />)

    expect(screen.queryByLabelText('Ändra ansvarig tekniker')).toBeNull()
    expect(screen.getByText(/Ansvarig: Ej tilldelad/)).toBeTruthy()
  })
})
