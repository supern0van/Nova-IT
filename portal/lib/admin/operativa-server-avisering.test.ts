import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

/**
 * Verifierar samtyckeskontrollen i laggTillOperativtMeddelande() specifikt -
 * att kunden avisera via mail ENDAST vid icke-internt svar OCH bara om hen
 * inte opt:at ut (kontakt_uppdatering_epost, se kundportalens
 * /kontaktinstallningar). Ett eget, litet testfilsscope (i stället för att
 * byggas in i operativa-server.test.ts) för att inte krocka med den filens
 * snävt uppsatta from()-mock för skapaOperativtArende-testerna.
 */

const forsokAviseraKundOmSvar = vi.fn()
vi.mock('@/lib/admin/arende-avisering-server', () => ({
  forsokAviseraKundOmSvar,
}))

const meddelandeSingle = vi.fn()
const meddelandeSelect = vi.fn(() => ({ single: meddelandeSingle }))
const meddelandeInsert = vi.fn(() => ({ select: meddelandeSelect }))

const arendeUpdateEq = vi.fn().mockResolvedValue({ error: null })
const arendeUpdate = vi.fn(() => ({ eq: arendeUpdateEq }))
const arendeSelectSingle = vi.fn()
const arendeSelectEq = vi.fn(() => ({ single: arendeSelectSingle }))
const arendeSelect = vi.fn(() => ({ eq: arendeSelectEq }))

const aktivitetInsert = vi.fn().mockResolvedValue({ error: null })

const kundSelectSingle = vi.fn()
const kundSelectEq = vi.fn(() => ({ single: kundSelectSingle }))
const kundSelect = vi.fn(() => ({ eq: kundSelectEq }))

const from = vi.fn((table: string) => {
  if (table === 'admin_meddelanden') return { insert: meddelandeInsert }
  if (table === 'admin_arenden') return { update: arendeUpdate, select: arendeSelect }
  if (table === 'admin_aktiviteter') return { insert: aktivitetInsert }
  if (table === 'admin_kunder') return { select: kundSelect }
  throw new Error(`Oväntad tabell i test: ${table}`)
})

vi.mock('@/lib/supabase/service', () => ({
  skapaSupabaseServiceklient: () => ({ from }),
}))

let laggTillOperativtMeddelande: typeof import('@/lib/admin/operativa-server').laggTillOperativtMeddelande

beforeAll(async () => {
  ;({ laggTillOperativtMeddelande } = await import('@/lib/admin/operativa-server'))
})

const sparadMeddelandeRad = {
  id: 'm1',
  arende_id: 'arende-1',
  avsandare: 'personal',
  avsandare_namn: 'Admin Nova',
  text: 'Svar till kund',
  internt: false,
  tidpunkt: new Date().toISOString(),
}

const arendeRad = {
  kund_id: 'kund-1',
  arendenummer: 'NIT-2504',
  kund_namn: 'Birgitta Sandell',
  epost: 'birgitta@exempel.se',
}

describe('laggTillOperativtMeddelande – kundavisering', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('aviserar kunden vid icke-internt svar när hen inte opt:at ut', async () => {
    meddelandeSingle.mockResolvedValue({ data: sparadMeddelandeRad, error: null })
    arendeSelectSingle.mockResolvedValue({ data: arendeRad, error: null })
    kundSelectSingle.mockResolvedValue({ data: { kontakt_uppdatering_epost: true }, error: null })

    await laggTillOperativtMeddelande({
      arendeId: 'arende-1',
      text: 'Svar till kund',
      internt: false,
      avsandareNamn: 'Admin Nova',
    })

    expect(forsokAviseraKundOmSvar).toHaveBeenCalledWith({
      epost: 'birgitta@exempel.se',
      kundNamn: 'Birgitta Sandell',
      arendenummer: 'NIT-2504',
      arendeId: 'arende-1',
    })
  })

  it('aviserar INTE kunden om hen opt:at ut ur mailuppdateringar', async () => {
    meddelandeSingle.mockResolvedValue({ data: sparadMeddelandeRad, error: null })
    arendeSelectSingle.mockResolvedValue({ data: arendeRad, error: null })
    kundSelectSingle.mockResolvedValue({ data: { kontakt_uppdatering_epost: false }, error: null })

    await laggTillOperativtMeddelande({
      arendeId: 'arende-1',
      text: 'Svar till kund',
      internt: false,
      avsandareNamn: 'Admin Nova',
    })

    expect(forsokAviseraKundOmSvar).not.toHaveBeenCalled()
  })

  it('aviserar INTE kunden för en intern anteckning', async () => {
    meddelandeSingle.mockResolvedValue({
      data: { ...sparadMeddelandeRad, internt: true },
      error: null,
    })

    await laggTillOperativtMeddelande({
      arendeId: 'arende-1',
      text: 'Intern anteckning',
      internt: true,
      avsandareNamn: 'Admin Nova',
    })

    expect(arendeSelect).not.toHaveBeenCalled()
    expect(kundSelect).not.toHaveBeenCalled()
    expect(forsokAviseraKundOmSvar).not.toHaveBeenCalled()
  })
})
