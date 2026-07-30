import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

/**
 * Verifierar att skapaOperativKund() - personalens egen "Ny kund"-dialog -
 * ger kunden kundportalåtkomst precis som det publika kontaktformuläret
 * redan gör (publikt-intag-server.ts). Innan detta byggdes fick en kund som
 * skapades manuellt (t.ex. vid ett telefonsamtal) ALDRIG ett kundportalkonto
 * eller välkomstmejl.
 */

const forsokSkapaKundportalKonto = vi.fn()
vi.mock('@/lib/admin/kundportal-konto-client', () => ({
  forsokSkapaKundportalKonto,
}))

const forsokSkickaValkomstmejl = vi.fn()
vi.mock('@/lib/admin/kundportal-valkomst-server', () => ({
  forsokSkickaValkomstmejl,
}))

const kundRad = {
  id: 'kund-1',
  namn: 'Birgitta Sandell',
  kundtyp: 'privatperson',
  epost: 'birgitta@exempel.se',
  telefon: '070-000 00 00',
  adress: 'Loviselundsvägen 42',
  ort: 'Hässelby',
  senaste_kontakt: new Date().toISOString(),
  skapad: new Date().toISOString(),
}

const insertSingle = vi.fn().mockResolvedValue({ data: kundRad, error: null })
const insertSelect = vi.fn(() => ({ single: insertSingle }))
const kundInsert = vi.fn(() => ({ select: insertSelect }))
const anteckningInsert = vi.fn().mockResolvedValue({ error: null })

const from = vi.fn((table: string) => {
  if (table === 'admin_kunder') return { insert: kundInsert }
  if (table === 'admin_kundanteckningar') return { insert: anteckningInsert }
  throw new Error(`Oväntad tabell i test: ${table}`)
})

vi.mock('@/lib/supabase/service', () => ({
  skapaSupabaseServiceklient: () => ({ from }),
}))

let skapaOperativKund: typeof import('@/lib/admin/operativa-server').skapaOperativKund

beforeAll(async () => {
  ;({ skapaOperativKund } = await import('@/lib/admin/operativa-server'))
})

const giltigaUppgifter = {
  namn: 'Birgitta Sandell',
  kundtyp: 'privatperson' as const,
  epost: 'birgitta@exempel.se',
  telefon: '070-000 00 00',
  adress: 'Loviselundsvägen 42',
  ort: 'Hässelby',
  forfattare: 'Admin Nova',
}

describe('skapaOperativKund – kundportalkonto vid manuellt skapad kund', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('skapar kundportalkonto och skickar välkomstmejl när ett tillfälligt lösenord ges', async () => {
    forsokSkapaKundportalKonto.mockResolvedValue({
      kontoSkapat: true,
      tillfalligtLosenord: 'tillfalligt-losenord-123',
    })

    await skapaOperativKund(giltigaUppgifter)

    expect(forsokSkapaKundportalKonto).toHaveBeenCalledWith('kund-1', 'birgitta@exempel.se')
    expect(forsokSkickaValkomstmejl).toHaveBeenCalledWith({
      epost: 'birgitta@exempel.se',
      kundNamn: 'Birgitta Sandell',
      tillfalligtLosenord: 'tillfalligt-losenord-123',
    })
  })

  it('skickar inget välkomstmejl om kontot redan fanns (inget tillfälligt lösenord)', async () => {
    forsokSkapaKundportalKonto.mockResolvedValue({ kontoSkapat: false })

    await skapaOperativKund(giltigaUppgifter)

    expect(forsokSkickaValkomstmejl).not.toHaveBeenCalled()
  })

  it('skapar ändå kunden om kundportalen inte kan nås (soft-fail)', async () => {
    forsokSkapaKundportalKonto.mockResolvedValue(undefined)

    const kund = await skapaOperativKund(giltigaUppgifter)

    expect(kund.id).toBe('kund-1')
    expect(forsokSkickaValkomstmejl).not.toHaveBeenCalled()
  })
})
