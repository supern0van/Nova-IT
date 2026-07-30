import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const profileRows = vi.fn()
const arendeInsert = vi.fn()
const arendeSingle = vi.fn()
const rpc = vi.fn()

function selectBuilder() {
  return {
    eq: vi.fn(() => ({ maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })) })),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
  }
}

const service = {
  from: vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: profileRows(), error: null })),
        })),
      }
    }
    if (table === 'admin_arenden') {
      return {
        select: vi.fn(() => selectBuilder()),
        insert: vi.fn((payload: unknown) => {
          arendeInsert(payload)
          return { select: vi.fn(() => ({ single: arendeSingle })) }
        }),
      }
    }
    if (table === 'admin_kunder') {
      return {
        select: vi.fn(() => selectBuilder()),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'kund-1', namn: 'Test Kund', kundtyp: 'privatperson', epost: 'test@example.com',
                telefon: '070-1234567', organisation: null,
              },
              error: null,
            }),
          })),
        })),
        update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
      }
    }
    if (table === 'admin_meddelanden' || table === 'admin_aktiviteter') {
      return { insert: vi.fn(() => Promise.resolve({ error: null })) }
    }
    throw new Error(`Oväntad tabell: ${table}`)
  }),
  rpc,
}

vi.mock('@/lib/supabase/service', () => ({
  skapaSupabaseServiceklient: () => service,
}))

describe('skapaPubliktIntag – ansvarig routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    profileRows.mockReturnValue([
      { id: 'webmaster-id', namn: 'Webmaster', epost: 'webmaster@nova-it.se', roll: 'administrator', aktiv: true },
      { id: 'support-id', namn: 'Nova IT Support', epost: 'support@nova-it.se', roll: 'medarbetare', aktiv: true },
    ])
    rpc.mockResolvedValue({ data: 'NIT-3001', error: null })
    arendeSingle.mockResolvedValue({
      data: {
        id: 'arende-1', arendenummer: 'NIT-3001', skapad: new Date().toISOString(),
      },
      error: null,
    })
  })

  it('tilldelar publika ärenden support först och faller tillbaka till admin', async () => {
    const { skapaPubliktIntag } = await import('@/lib/admin/publikt-intag-server')

    await skapaPubliktIntag({
      kalla: 'kontaktformular', namn: 'Test Kund', epost: 'test@example.com', telefon: '070-1234567',
      kundtyp: 'privatperson', tjanstSlug: 'it-support', angelagenhet: 'normal',
      meddelande: 'Detta är en tillräckligt lång testförfrågan.', idempotensnyckel: 'test-intag-1234567890',
    })

    expect(arendeInsert).toHaveBeenCalledWith(expect.objectContaining({ ansvarig_id: 'support-id' }))
  })

  it('avvisar telefonnummer med otillåtna tecken (regression: matchar nu adminportalens egna dialoger)', async () => {
    // Innan validering.ts konsoliderade valideringen saknade det publika
    // formulärets egen kopia av arGiltigTelefon teckenbegränsningen som
    // adminportalens "Ny kund"-dialog hade - det här ska inte kunna hända
    // igen nu när båda delar samma funktion.
    const { skapaPubliktIntag, PubliktIntagFel } = await import('@/lib/admin/publikt-intag-server')

    await expect(
      skapaPubliktIntag({
        kalla: 'kontaktformular',
        namn: 'Test Kund',
        epost: 'test@example.com',
        telefon: 'abc-070-1234567-xyz',
        kundtyp: 'privatperson',
        tjanstSlug: 'it-support',
        angelagenhet: 'normal',
        meddelande: 'Detta är en tillräckligt lång testförfrågan.',
        idempotensnyckel: 'test-intag-telefon-validering-1234567890',
      }),
    ).rejects.toBeInstanceOf(PubliktIntagFel)
    expect(arendeInsert).not.toHaveBeenCalled()
  })

})

describe('skapaPubliktIntag – kundportalskonto (Milstolpe 2)', () => {
  const ENV_NYCKLAR = ['KUNDPORTAL_URL', 'KUNDPORTAL_INTAG_SECRET'] as const
  const ursprungligEnv: Record<string, string | undefined> = {}
  let ursprungligFetch: typeof fetch

  beforeEach(() => {
    vi.clearAllMocks()
    profileRows.mockReturnValue([
      { id: 'support-id', namn: 'Nova IT Support', epost: 'support@nova-it.se', roll: 'medarbetare', aktiv: true },
    ])
    rpc.mockResolvedValue({ data: 'NIT-3002', error: null })
    arendeSingle.mockResolvedValue({
      data: { id: 'arende-1', arendenummer: 'NIT-3002', skapad: new Date().toISOString() },
      error: null,
    })
    for (const nyckel of ENV_NYCKLAR) ursprungligEnv[nyckel] = process.env[nyckel]
    ursprungligFetch = globalThis.fetch
  })

  afterEach(() => {
    for (const nyckel of ENV_NYCKLAR) {
      if (ursprungligEnv[nyckel] === undefined) delete process.env[nyckel]
      else process.env[nyckel] = ursprungligEnv[nyckel]
    }
    globalThis.fetch = ursprungligFetch
  })

  const uppgifter = {
    kalla: 'kontaktformular' as const, namn: 'Test Kund', epost: 'test@example.com', telefon: '070-1234567',
    kundtyp: 'privatperson' as const, tjanstSlug: 'it-support', angelagenhet: 'normal' as const,
    meddelande: 'Detta är en tillräckligt lång testförfrågan.', idempotensnyckel: 'test-intag-kundportal-123',
  }

  it('returnerar odefinierat kundportalKonto om KUNDPORTAL_URL/KUNDPORTAL_INTAG_SECRET saknas, utan att anropa fetch', async () => {
    delete process.env.KUNDPORTAL_URL
    delete process.env.KUNDPORTAL_INTAG_SECRET
    let fetchAnropad = false
    globalThis.fetch = (async () => {
      fetchAnropad = true
      throw new Error('ska inte anropas')
    }) as unknown as typeof fetch

    const { skapaPubliktIntag } = await import('@/lib/admin/publikt-intag-server')
    const resultat = await skapaPubliktIntag(uppgifter)

    expect(resultat.kundportalKonto).toBeUndefined()
    expect(fetchAnropad).toBe(false)
  })

  it('returnerar tillfälligt lösenord när kundportalen skapar ett nytt konto', async () => {
    process.env.KUNDPORTAL_URL = 'https://kundportal.nova-it.se'
    process.env.KUNDPORTAL_INTAG_SECRET = 'test-hemlighet'
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ ok: true, kontoSkapat: true, tillfalligtLosenord: 'hemligt-123' }), {
        status: 200,
      })) as unknown as typeof fetch

    const { skapaPubliktIntag } = await import('@/lib/admin/publikt-intag-server')
    const resultat = await skapaPubliktIntag(uppgifter)

    expect(resultat.kundportalKonto).toEqual({ kontoSkapat: true, tillfalligtLosenord: 'hemligt-123' })
  })

  it('returnerar odefinierat kundportalKonto (utan att kasta) om kundportalen svarar med fel', async () => {
    process.env.KUNDPORTAL_URL = 'https://kundportal.nova-it.se'
    process.env.KUNDPORTAL_INTAG_SECRET = 'test-hemlighet'
    globalThis.fetch = (async () => new Response(JSON.stringify({ ok: false }), { status: 401 })) as unknown as typeof fetch

    const { skapaPubliktIntag } = await import('@/lib/admin/publikt-intag-server')
    const resultat = await skapaPubliktIntag(uppgifter)

    expect(resultat.kundportalKonto).toBeUndefined()
    expect(resultat.arendenummer).toBe('NIT-3002')
  })

  it('returnerar odefinierat kundportalKonto (utan att kasta) om kundportalen inte kan nås', async () => {
    process.env.KUNDPORTAL_URL = 'https://kundportal.nova-it.se'
    process.env.KUNDPORTAL_INTAG_SECRET = 'test-hemlighet'
    globalThis.fetch = (async () => {
      throw new Error('connection refused')
    }) as unknown as typeof fetch

    const { skapaPubliktIntag } = await import('@/lib/admin/publikt-intag-server')
    const resultat = await skapaPubliktIntag(uppgifter)

    expect(resultat.kundportalKonto).toBeUndefined()
    expect(resultat.arendenummer).toBe('NIT-3002')
  })
})
