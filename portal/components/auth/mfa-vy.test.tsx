// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { TotpFaktor } from '@/lib/auth/mfa-klient'

const utmanaOchVerifieraKod = vi.fn()

vi.mock('@/lib/auth/mfa-klient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/mfa-klient')>()
  return { ...actual, utmanaOchVerifieraKod }
})

let VerifieraVy: typeof import('@/components/auth/mfa-vy').VerifieraVy

beforeAll(async () => {
  ;({ VerifieraVy } = await import('@/components/auth/mfa-vy'))
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test-dubblett, behöver bara vara "något klientliknande"
const supabaseStub = {} as any

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
