// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { TotpFaktor } from '@/lib/auth/mfa-klient'

const replace = vi.fn()
const loggaUt = vi.fn()
const hamtaAssuransniva = vi.fn()
const listaTotpFaktorer = vi.fn()
const paborjaEnrollment = vi.fn()
const avbrytEnrollment = vi.fn()
const utmanaOchVerifieraKod = vi.fn()
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test-dubblett, behöver bara vara "något klientliknande"
const supabaseStub = {} as any

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/auth/supabase-auth', () => ({
  authAdapter: { loggaUt },
}))

vi.mock('@/lib/auth/mfa-klient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/mfa-klient')>()
  return {
    ...actual,
    avbrytEnrollment,
    hamtaAssuransniva,
    listaTotpFaktorer,
    paborjaEnrollment,
    utmanaOchVerifieraKod,
  }
})

vi.mock('@/lib/supabase/client', () => ({
  skapaSupabaseWebblasarklient: () => supabaseStub,
}))

let MfaVy: typeof import('@/components/auth/mfa-vy').MfaVy
let VerifieraVy: typeof import('@/components/auth/mfa-vy').VerifieraVy

beforeAll(async () => {
  ;({ MfaVy, VerifieraVy } = await import('@/components/auth/mfa-vy'))
})

const faktorPrimar: TotpFaktor = {
  id: 'faktor-primar',
  vanligtNamn: 'Primär enhet',
  status: 'verified',
  skapad: '2026-01-01T00:00:00Z',
}
const faktorBackup: TotpFaktor = {
  id: 'faktor-backup',
  vanligtNamn: 'Backup-enhet',
  status: 'verified',
  skapad: '2026-02-01T00:00:00Z',
}

describe('VerifieraVy – val av MFA-faktor vid inloggning', () => {
  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('visar INGEN väljare när användaren bara har en verifierad faktor', () => {
    render(
      <VerifieraVy
        faktorer={[faktorPrimar]}
        vidKlar={vi.fn()}
        vidLoggaUt={vi.fn()}
        supabase={supabaseStub}
      />,
    )
    expect(screen.queryByText('Vilken enhet vill du använda?')).toBeNull()
  })

  it('visar båda enheternas namn (friendly name) när flera verifierade faktorer finns', () => {
    render(
      <VerifieraVy
        faktorer={[faktorPrimar, faktorBackup]}
        vidKlar={vi.fn()}
        vidLoggaUt={vi.fn()}
        supabase={supabaseStub}
      />,
    )
    expect(screen.getByText('Primär enhet')).toBeTruthy()
    expect(screen.getByText('Backup-enhet')).toBeTruthy()
  })

  it('använder den FÖRSTA faktorn som förval', async () => {
    utmanaOchVerifieraKod.mockResolvedValue({ ok: true })
    render(
      <VerifieraVy
        faktorer={[faktorPrimar, faktorBackup]}
        vidKlar={vi.fn()}
        vidLoggaUt={vi.fn()}
        supabase={supabaseStub}
      />,
    )

    fireEvent.change(screen.getByLabelText('Verifieringskod'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /verifiera/i }))

    await vi.waitFor(() => {
      expect(utmanaOchVerifieraKod).toHaveBeenCalledWith(supabaseStub, 'faktor-primar', '123456')
    })
  })

  it('användaren kan VÄLJA den andra (backup-)faktorn, och den valda factorId används för challenge/verify', async () => {
    utmanaOchVerifieraKod.mockResolvedValue({ ok: true })
    const vidKlar = vi.fn()
    render(
      <VerifieraVy
        faktorer={[faktorPrimar, faktorBackup]}
        vidKlar={vidKlar}
        vidLoggaUt={vi.fn()}
        supabase={supabaseStub}
      />,
    )

    // Väljer den andra faktorn (backup-enheten) explicit.
    fireEvent.click(screen.getByLabelText('Backup-enhet'))
    fireEvent.change(screen.getByLabelText('Verifieringskod'), { target: { value: '654321' } })
    fireEvent.click(screen.getByRole('button', { name: /verifiera/i }))

    await vi.waitFor(() => {
      expect(utmanaOchVerifieraKod).toHaveBeenCalledWith(supabaseStub, 'faktor-backup', '654321')
      expect(vidKlar).toHaveBeenCalled()
    })
  })

  it('en förlorad primärenhet blockerar inte inloggning – backup-faktorn fungerar fristående', async () => {
    // Simulerar att bara backup-faktorn skickas med (t.ex. om primären av
    // någon anledning inte längre räknas som verifierad) – väljaren visar
    // då bara den faktorn, och den fungerar precis som vanligt.
    utmanaOchVerifieraKod.mockResolvedValue({ ok: true })
    const vidKlar = vi.fn()
    render(
      <VerifieraVy
        faktorer={[faktorBackup]}
        vidKlar={vidKlar}
        vidLoggaUt={vi.fn()}
        supabase={supabaseStub}
      />,
    )

    fireEvent.change(screen.getByLabelText('Verifieringskod'), { target: { value: '111111' } })
    fireEvent.click(screen.getByRole('button', { name: /verifiera/i }))

    await vi.waitFor(() => {
      expect(utmanaOchVerifieraKod).toHaveBeenCalledWith(supabaseStub, 'faktor-backup', '111111')
      expect(vidKlar).toHaveBeenCalled()
    })
  })
})

describe('MfaVy – enrollment och felstatus', () => {
  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('visar felvy och kan logga ut om säkerhetsstatus inte kan läsas', async () => {
    hamtaAssuransniva.mockResolvedValue(null)
    loggaUt.mockResolvedValue({ ok: true })

    render(<MfaVy />)

    expect(await screen.findByText('Något gick fel')).toBeTruthy()
    expect(screen.getByText('Kunde inte läsa kontots säkerhetsstatus.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Logga ut och försök igen' }))

    await waitFor(() => {
      expect(loggaUt).toHaveBeenCalled()
      expect(replace).toHaveBeenCalledWith('/logga-in')
    })
  })

  it('redirectar direkt om sessionen redan är AAL2-verifierad', async () => {
    hamtaAssuransniva.mockResolvedValue({ currentLevel: 'aal2', nextLevel: 'aal2' })

    render(<MfaVy />)

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/portal')
    })
    expect(paborjaEnrollment).not.toHaveBeenCalled()
    expect(listaTotpFaktorer).not.toHaveBeenCalled()
  })

  it('visar enrollment och verifierar första obligatoriska TOTP-enheten', async () => {
    hamtaAssuransniva.mockResolvedValue({ currentLevel: 'aal1', nextLevel: 'aal1' })
    paborjaEnrollment.mockResolvedValue({
      ok: true,
      factorId: 'ny-faktor',
      qrKodDataUrl: 'data:image/svg+xml,<svg />',
      hemlighetForManuellInmatning: 'ABCDEF',
    })
    utmanaOchVerifieraKod.mockResolvedValue({ ok: true })

    render(<MfaVy />)

    expect(await screen.findByText('Sätt upp tvåstegsverifiering')).toBeTruthy()
    expect(screen.getByAltText('QR-kod för tvåstegsverifiering')).toBeTruthy()
    expect(paborjaEnrollment).toHaveBeenCalledWith(supabaseStub, 'Primär enhet')

    fireEvent.click(screen.getByText('Kan du inte skanna koden?'))
    expect(screen.getByText('ABCDEF')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Kod från autentiseringsappen'), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aktivera tvåstegsverifiering' }))

    await waitFor(() => {
      expect(utmanaOchVerifieraKod).toHaveBeenCalledWith(supabaseStub, 'ny-faktor', '123456')
      expect(replace).toHaveBeenCalledWith('/portal')
    })
  })
})
