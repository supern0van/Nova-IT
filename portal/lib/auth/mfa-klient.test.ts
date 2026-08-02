import { describe, expect, it, vi } from 'vitest'

import {
  avbrytEnrollment,
  avregistreraFaktor,
  hamtaAssuransniva,
  listaTotpFaktorer,
  oversattMfaFel,
  paborjaEnrollment,
  utmanaOchVerifieraKod,
  visningsnamnForFaktor,
  type TotpFaktor,
} from '@/lib/auth/mfa-klient'

/**
 * Uppmockad `SupabaseClient` – bara `auth.mfa.*`-ytan som modulen faktiskt
 * använder. Låter oss testa hela enrollment-, verifierings- och
 * hanteringsflödet utan nätverk eller ett riktigt Supabase-projekt.
 */
function skapaMockSupabase(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      mfa: {
        enroll: vi.fn(),
        challenge: vi.fn(),
        verify: vi.fn(),
        unenroll: vi.fn(),
        listFactors: vi.fn(),
        getAuthenticatorAssuranceLevel: vi.fn(),
        ...overrides,
      },
      refreshSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'x' } }, error: null }),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

describe('paborjaEnrollment', () => {
  it('lyckad enrollment: returnerar QR-kod, hemlighet och faktor-id', async () => {
    const supabase = skapaMockSupabase({
      enroll: vi.fn().mockResolvedValue({
        data: {
          id: 'faktor-1',
          totp: { qr_code: 'data:image/svg+xml;utf-8,<svg/>', secret: 'HEMLIGHET123', uri: 'otpauth://...' },
        },
        error: null,
      }),
    })

    const resultat = await paborjaEnrollment(supabase)

    expect(resultat.ok).toBe(true)
    if (resultat.ok) {
      expect(resultat.factorId).toBe('faktor-1')
      expect(resultat.qrKodDataUrl).toContain('data:image/svg+xml')
      expect(resultat.hemlighetForManuellInmatning).toBe('HEMLIGHET123')
    }
    expect(supabase.auth.mfa.enroll).toHaveBeenCalledWith({ factorType: 'totp' })
  })

  it('skickar med friendlyName till Supabase när det anges (viktigt för backup-enheter)', async () => {
    const supabase = skapaMockSupabase({
      enroll: vi.fn().mockResolvedValue({
        data: {
          id: 'faktor-2',
          totp: { qr_code: 'data:image/svg+xml;utf-8,<svg/>', secret: 'HEMLIGHET456', uri: 'otpauth://...' },
        },
        error: null,
      }),
    })

    await paborjaEnrollment(supabase, 'Backup-enhet')

    expect(supabase.auth.mfa.enroll).toHaveBeenCalledWith({
      factorType: 'totp',
      friendlyName: 'Backup-enhet',
    })
  })

  it('fel vid enrollment: returnerar ok:false med svensk feltext', async () => {
    const supabase = skapaMockSupabase({
      enroll: vi.fn().mockResolvedValue({ data: null, error: { message: 'Network request failed' } }),
    })

    const resultat = await paborjaEnrollment(supabase)

    expect(resultat.ok).toBe(false)
    if (!resultat.ok) {
      expect(resultat.fel).toMatch(/internetanslutning/i)
    }
  })
})

describe('utmanaOchVerifieraKod', () => {
  it('lyckad verifiering: skapar utmaning och verifierar koden', async () => {
    const supabase = skapaMockSupabase({
      challenge: vi.fn().mockResolvedValue({ data: { id: 'utmaning-1' }, error: null }),
      verify: vi.fn().mockResolvedValue({ data: { access_token: 'x' }, error: null }),
    })

    const resultat = await utmanaOchVerifieraKod(supabase, 'faktor-1', '123456')

    expect(resultat.ok).toBe(true)
    expect(supabase.auth.mfa.challenge).toHaveBeenCalledWith({ factorId: 'faktor-1' })
    expect(supabase.auth.mfa.verify).toHaveBeenCalledWith({
      factorId: 'faktor-1',
      challengeId: 'utmaning-1',
      code: '123456',
    })
  })

  it('felaktig TOTP-kod: returnerar ok:false och svenskt felmeddelande', async () => {
    const supabase = skapaMockSupabase({
      challenge: vi.fn().mockResolvedValue({ data: { id: 'utmaning-1' }, error: null }),
      verify: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Invalid TOTP code entered' },
      }),
    })

    const resultat = await utmanaOchVerifieraKod(supabase, 'faktor-1', '000000')

    expect(resultat.ok).toBe(false)
    if (!resultat.ok) {
      expect(resultat.fel).toMatch(/fel kod/i)
    }
  })

  it('nytt försök skapar en NY utmaning (utmaningar återanvänds inte)', async () => {
    const supabase = skapaMockSupabase({
      challenge: vi
        .fn()
        .mockResolvedValueOnce({ data: { id: 'utmaning-1' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'utmaning-2' }, error: null }),
      verify: vi
        .fn()
        .mockResolvedValueOnce({ data: null, error: { message: 'Invalid TOTP code entered' } })
        .mockResolvedValueOnce({ data: { access_token: 'x' }, error: null }),
    })

    const forsta = await utmanaOchVerifieraKod(supabase, 'faktor-1', '000000')
    const andra = await utmanaOchVerifieraKod(supabase, 'faktor-1', '654321')

    expect(forsta.ok).toBe(false)
    expect(andra.ok).toBe(true)
    expect(supabase.auth.mfa.challenge).toHaveBeenCalledTimes(2)
    expect(supabase.auth.mfa.verify).toHaveBeenNthCalledWith(2, {
      factorId: 'faktor-1',
      challengeId: 'utmaning-2',
      code: '654321',
    })
  })

  it('fel vid challenge-steget stoppar innan verify anropas', async () => {
    const supabase = skapaMockSupabase({
      challenge: vi.fn().mockResolvedValue({ data: null, error: { message: 'Too many requests' } }),
      verify: vi.fn(),
    })

    const resultat = await utmanaOchVerifieraKod(supabase, 'faktor-1', '123456')

    expect(resultat.ok).toBe(false)
    expect(supabase.auth.mfa.verify).not.toHaveBeenCalled()
  })
})

describe('avbrytEnrollment (avbruten enrollment)', () => {
  it('avregistrerar den overifierade faktorn med rätt faktor-id', async () => {
    const supabase = skapaMockSupabase({
      unenroll: vi.fn().mockResolvedValue({ data: { id: 'faktor-1' }, error: null }),
    })

    const resultat = await avbrytEnrollment(supabase, 'faktor-1')

    expect(resultat.ok).toBe(true)
    expect(supabase.auth.mfa.unenroll).toHaveBeenCalledWith({ factorId: 'faktor-1' })
    expect(supabase.auth.mfa.unenroll).toHaveBeenCalledTimes(1)
  })

  it('misslyckad städning: returnerar ok:false med ett begripligt svenskt felmeddelande (INTE ett tyst/falskt lyckat resultat)', async () => {
    const supabase = skapaMockSupabase({
      unenroll: vi.fn().mockResolvedValue({ data: null, error: { message: 'Network request failed' } }),
    })

    const resultat = await avbrytEnrollment(supabase, 'faktor-1')

    expect(resultat.ok).toBe(false)
    if (!resultat.ok) {
      expect(resultat.fel).toBeTruthy()
      expect(resultat.fel.length).toBeGreaterThan(0)
      expect(resultat.fel).toMatch(/kunde inte städa/i)
    }
  })

  it('anropar unenroll med den faktor-id som skickades in, inte ett hårdkodat värde', async () => {
    const supabase = skapaMockSupabase({
      unenroll: vi.fn().mockResolvedValue({ data: { id: 'annan-faktor' }, error: null }),
    })

    await avbrytEnrollment(supabase, 'annan-faktor-id-999')

    expect(supabase.auth.mfa.unenroll).toHaveBeenCalledWith({ factorId: 'annan-faktor-id-999' })
  })
})

describe('avregistreraFaktor', () => {
  it('lyckas', async () => {
    const supabase = skapaMockSupabase({
      unenroll: vi.fn().mockResolvedValue({ data: { id: 'faktor-1' }, error: null }),
      getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({ data: { currentLevel: 'aal2' }, error: null }),
    })
    supabase.auth.refreshSession = vi.fn().mockResolvedValue({ data: { session: { access_token: 'x' } }, error: null })
    const resultat = await avregistreraFaktor(supabase, 'faktor-1')
    expect(resultat.ok).toBe(true)
    expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1)
    expect(supabase.auth.mfa.getAuthenticatorAssuranceLevel).toHaveBeenCalledTimes(1)
  })

  it('returnerar svenskt fel om Supabase nekar (t.ex. ej aal2)', async () => {
    const supabase = skapaMockSupabase({
      unenroll: vi.fn().mockResolvedValue({ data: null, error: { message: 'AAL2 required' } }),
    })
    const resultat = await avregistreraFaktor(supabase, 'faktor-1')
    expect(resultat.ok).toBe(false)
  })

  it('fail-closed och markerar MFA-krav om refreshSession misslyckas', async () => {
    const supabase = skapaMockSupabase({
      unenroll: vi.fn().mockResolvedValue({ data: { id: 'faktor-1' }, error: null }),
    })
    supabase.auth.refreshSession = vi.fn().mockResolvedValue({ data: { session: null }, error: { message: 'refresh failed' } })

    const resultat = await avregistreraFaktor(supabase, 'faktor-1')

    expect(resultat).toEqual({
      ok: false,
      fel: 'Säkerhetssessionen kunde inte uppdateras. Du måste verifiera MFA igen.',
      mfaKravd: true,
    })
    expect(supabase.auth.mfa.getAuthenticatorAssuranceLevel).not.toHaveBeenCalled()
  })

  it('fail-closed och markerar MFA-krav om sessionen efter refresh inte är AAL2', async () => {
    const supabase = skapaMockSupabase({
      unenroll: vi.fn().mockResolvedValue({ data: { id: 'faktor-1' }, error: null }),
      getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({ data: { currentLevel: 'aal1' }, error: null }),
    })
    supabase.auth.refreshSession = vi.fn().mockResolvedValue({ data: { session: { access_token: 'x' } }, error: null })

    const resultat = await avregistreraFaktor(supabase, 'faktor-1')

    expect(resultat.ok).toBe(false)
    expect(resultat).toMatchObject({ mfaKravd: true })
  })
})

describe('listaTotpFaktorer', () => {
  it('mappar Supabase-faktorer till TotpFaktor[]', async () => {
    const supabase = skapaMockSupabase({
      listFactors: vi.fn().mockResolvedValue({
        data: {
          totp: [
            {
              id: 'faktor-1',
              friendly_name: 'Telefon',
              factor_type: 'totp',
              status: 'verified',
              created_at: '2026-01-01T00:00:00Z',
            },
          ],
          phone: [],
        },
        error: null,
      }),
    })

    const resultat = await listaTotpFaktorer(supabase)

    expect(Array.isArray(resultat)).toBe(true)
    if (Array.isArray(resultat)) {
      expect(resultat).toHaveLength(1)
      expect(resultat[0]).toMatchObject({ id: 'faktor-1', status: 'verified' })
    }
  })

  it('returnerar en tom lista när användaren saknar MFA', async () => {
    const supabase = skapaMockSupabase({
      listFactors: vi.fn().mockResolvedValue({ data: { totp: [], phone: [] }, error: null }),
    })

    const resultat = await listaTotpFaktorer(supabase)
    expect(resultat).toEqual([])
  })

  it('returnerar svenskt fel om faktorer inte kan läsas', async () => {
    const supabase = skapaMockSupabase({
      listFactors: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Network request failed' },
      }),
    })

    const resultat = await listaTotpFaktorer(supabase)

    expect(Array.isArray(resultat)).toBe(false)
    if (!Array.isArray(resultat)) {
      expect(resultat.ok).toBe(false)
      expect(resultat.fel).toMatch(/internetanslutning/i)
    }
  })
})

describe('hamtaAssuransniva', () => {
  it('returnerar current/next-nivå', async () => {
    const supabase = skapaMockSupabase({
      getAuthenticatorAssuranceLevel: vi
        .fn()
        .mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null }),
    })

    const resultat = await hamtaAssuransniva(supabase)
    expect(resultat).toEqual({ currentLevel: 'aal1', nextLevel: 'aal2' })
  })

  it('returnerar null vid fel', async () => {
    const supabase = skapaMockSupabase({
      getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({ data: null, error: { message: 'x' } }),
    })

    const resultat = await hamtaAssuransniva(supabase)
    expect(resultat).toBeNull()
  })
})

describe('visningsnamnForFaktor', () => {
  const bas: TotpFaktor = { id: 'faktor-1', status: 'verified', skapad: '2026-01-01T00:00:00Z' }

  it('använder friendly_name/vanligtNamn när det finns', () => {
    expect(visningsnamnForFaktor({ ...bas, vanligtNamn: 'Jobbtelefon' }, 0)).toBe('Jobbtelefon')
  })

  it('faller tillbaka till ett numrerat reservnamn när namnet saknas', () => {
    expect(visningsnamnForFaktor({ ...bas, vanligtNamn: undefined }, 0)).toBe('Autentiseringsapp 1')
    expect(visningsnamnForFaktor({ ...bas, vanligtNamn: undefined }, 1)).toBe('Autentiseringsapp 2')
  })

  it('faller tillbaka även för ett tomt/blankt namn', () => {
    expect(visningsnamnForFaktor({ ...bas, vanligtNamn: '   ' }, 2)).toBe('Autentiseringsapp 3')
  })
})

describe('oversattMfaFel', () => {
  it('faller tillbaka till ett generiskt svenskt meddelande för okända fel', () => {
    expect(oversattMfaFel('some completely unknown error')).toMatch(/något gick fel/i)
  })

  it('läcker aldrig rå engelsk API-text för okända fel', () => {
    const oversatt = oversattMfaFel('a very specific unmapped internal error code 42')
    expect(oversatt).not.toContain('internal error code')
  })
})
