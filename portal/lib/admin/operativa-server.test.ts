import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

/**
 * skapaOperativtArende() hämtar arendenummer via RPC:t
 * `nasta_admin_arendenummer` (en atomär Postgres-sekvens, se
 * 20260728165341_admin_arendenummer_sekvens.sql). Sekvensen eliminerar
 * själva racet, men insert mot admin_arenden kan i teorin ändå kollidera mot
 * den unika constrainten (23505) – t.ex. om en rad någon gång seedas eller
 * migreras in med ett arendenummer som redan finns i sekvensserien. Dessa
 * tester verifierar retry-skyddsnätet i skapaOperativtArende() för just det
 * scenariot, samt att inga andra feltyper trigga onödiga omförsök.
 */

const kundSingle = vi.fn()
const kundEq = vi.fn(() => ({ single: kundSingle }))
const kundSelect = vi.fn(() => ({ eq: kundEq }))
const kundUpdateEq = vi.fn().mockResolvedValue({ error: null })
const kundUpdate = vi.fn(() => ({ eq: kundUpdateEq }))

const rpc = vi.fn()

const insertSingle = vi.fn()
const insertSelect = vi.fn(() => ({ single: insertSingle }))
const arendeInsert = vi.fn(() => ({ select: insertSelect }))

const aktivitetInsert = vi.fn().mockResolvedValue({ error: null })

const from = vi.fn((table: string) => {
  if (table === 'admin_kunder') return { select: kundSelect, update: kundUpdate }
  if (table === 'admin_arenden') return { insert: arendeInsert }
  if (table === 'admin_aktiviteter') return { insert: aktivitetInsert }
  throw new Error(`Oväntad tabell i test: ${table}`)
})

vi.mock('@/lib/supabase/service', () => ({
  skapaSupabaseServiceklient: () => ({ from, rpc }),
}))

const forsokSkapaKundportalKontoMock = vi.fn()
vi.mock('@/lib/admin/kundportal-konto-client', () => ({
  forsokSkapaKundportalKonto: (...args: unknown[]) => forsokSkapaKundportalKontoMock(...args),
  forsokTaBortKundportalKonto: vi.fn(),
}))

const forsokSkickaValkomstmejlMock = vi.fn()
vi.mock('@/lib/admin/kundportal-valkomst-server', () => ({
  forsokSkickaValkomstmejl: (...args: unknown[]) => forsokSkickaValkomstmejlMock(...args),
}))

vi.mock('@/lib/admin/arende-avisering-server', () => ({
  forsokAviseraKundOmSvar: vi.fn(),
}))

let skapaOperativtArende: typeof import('@/lib/admin/operativa-server').skapaOperativtArende
let OperativtAdminFel: typeof import('@/lib/admin/operativa-server').OperativtAdminFel

beforeAll(async () => {
  ;({ skapaOperativtArende, OperativtAdminFel } = await import('@/lib/admin/operativa-server'))
})

const giltigaUppgifter = {
  kundId: 'kund-1',
  rubrik: 'Giltig rubrik',
  kategori: 'datorer_vardags_it' as const,
  underkategori: 'Prestanda och långsamhet',
  prioritet: 'normal' as const,
  kanal: 'telefon' as const,
  beskrivning: 'En beskrivning som räcker.',
  aktor: 'Admin Nova',
}

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

function arendeRad(nummer: string) {
  return {
    id: 'arende-1',
    arendenummer: nummer,
    rubrik: giltigaUppgifter.rubrik,
    kund_id: 'kund-1',
    kund_namn: 'Birgitta Sandell',
    kundtyp: 'privatperson',
    organisation: null,
    epost: 'birgitta@exempel.se',
    telefon: '070-000 00 00',
    kategori: 'datorer_vardags_it',
    underkategori: giltigaUppgifter.underkategori,
    status: 'ny',
    prioritet: 'normal',
    ansvarig_id: null,
    kanal: 'telefon',
    beskrivning: giltigaUppgifter.beskrivning,
    assistent_sammanfattning: null,
    bilagor: [],
    skapad: new Date().toISOString(),
    uppdaterad: new Date().toISOString(),
    sista_svar: null,
  }
}

describe('skapaOperativtArende – ärendenummer-race', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('lyckas direkt utan konflikt', async () => {
    kundSingle.mockResolvedValue({ data: kundRad, error: null })
    rpc.mockResolvedValue({ data: 'NIT-2501', error: null })
    insertSingle.mockResolvedValueOnce({ data: arendeRad('NIT-2501'), error: null })

    const arende = await skapaOperativtArende(giltigaUppgifter)

    expect(arende.arendenummer).toBe('NIT-2501')
    expect(arendeInsert).toHaveBeenCalledTimes(1)
  })

  it('försöker igen vid unik-constraint-krock (23505) och lyckas på andra försöket', async () => {
    kundSingle.mockResolvedValue({ data: kundRad, error: null })
    rpc.mockResolvedValue({ data: 'NIT-2501', error: null })
    insertSingle
      .mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'duplicate key' } })
      .mockResolvedValueOnce({ data: arendeRad('NIT-2501'), error: null })

    const arende = await skapaOperativtArende(giltigaUppgifter)

    expect(arende.arendenummer).toBe('NIT-2501')
    expect(arendeInsert).toHaveBeenCalledTimes(2)
    expect(rpc).toHaveBeenCalledTimes(2)
  })

  it('ger upp med 409 efter tre misslyckade försök i rad', async () => {
    kundSingle.mockResolvedValue({ data: kundRad, error: null })
    rpc.mockResolvedValue({ data: 'NIT-2501', error: null })
    insertSingle.mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate key' } })

    await expect(skapaOperativtArende(giltigaUppgifter)).rejects.toMatchObject({ status: 409 })
    expect(arendeInsert).toHaveBeenCalledTimes(3)
  })

  it('läcker aldrig rå Postgres-feltext i felmeddelandet till klienten', async () => {
    kundSingle.mockResolvedValue({ data: kundRad, error: null })
    rpc.mockResolvedValue({ data: 'NIT-2501', error: null })
    insertSingle.mockResolvedValue({
      data: null,
      error: {
        code: '23505',
        message: 'duplicate key value violates unique constraint "admin_arenden_arendenummer_key"',
      },
    })

    await expect(skapaOperativtArende(giltigaUppgifter)).rejects.toSatisfy((fel: unknown) => {
      if (!(fel instanceof OperativtAdminFel)) return false
      return !fel.message.includes('constraint') && !fel.message.includes('duplicate key')
    })
  })

  it('försöker inte igen vid en annan sorts databasfel (t.ex. främmande nyckel)', async () => {
    kundSingle.mockResolvedValue({ data: kundRad, error: null })
    rpc.mockResolvedValue({ data: 'NIT-2501', error: null })
    insertSingle.mockResolvedValueOnce({
      data: null,
      error: { code: '23503', message: 'foreign key violation' },
    })

    await expect(skapaOperativtArende(giltigaUppgifter)).rejects.toThrow('Kunde inte skapa ärende.')
    expect(arendeInsert).toHaveBeenCalledTimes(1)
  })
})

describe('skapaOperativtArende – kundportalskonto och välkomstmejl', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('skickar välkomstmejl med ärendenummer när ett NYTT kundportalskonto skapas', async () => {
    kundSingle.mockResolvedValue({ data: kundRad, error: null })
    rpc.mockResolvedValue({ data: 'NIT-2501', error: null })
    insertSingle.mockResolvedValueOnce({ data: arendeRad('NIT-2501'), error: null })
    forsokSkapaKundportalKontoMock.mockResolvedValue({
      kontoSkapat: true,
      tillfalligtLosenord: 'ett-tillfalligt-losenord',
    })

    const arende = await skapaOperativtArende(giltigaUppgifter)

    expect(arende.arendenummer).toBe('NIT-2501')
    expect(forsokSkapaKundportalKontoMock).toHaveBeenCalledWith('kund-1', 'birgitta@exempel.se')
    expect(forsokSkickaValkomstmejlMock).toHaveBeenCalledWith({
      epost: 'birgitta@exempel.se',
      kundNamn: 'Birgitta Sandell',
      tillfalligtLosenord: 'ett-tillfalligt-losenord',
      arendenummer: 'NIT-2501',
    })
  })

  it('skickar inget mejl när kunden redan hade ett kundportalskonto', async () => {
    kundSingle.mockResolvedValue({ data: kundRad, error: null })
    rpc.mockResolvedValue({ data: 'NIT-2501', error: null })
    insertSingle.mockResolvedValueOnce({ data: arendeRad('NIT-2501'), error: null })
    forsokSkapaKundportalKontoMock.mockResolvedValue({ kontoSkapat: false })

    await skapaOperativtArende(giltigaUppgifter)

    expect(forsokSkapaKundportalKontoMock).toHaveBeenCalledTimes(1)
    expect(forsokSkickaValkomstmejlMock).not.toHaveBeenCalled()
  })

  it('ärendet skapas ändå om kundportalskontot inte kan nås (soft-fail)', async () => {
    kundSingle.mockResolvedValue({ data: kundRad, error: null })
    rpc.mockResolvedValue({ data: 'NIT-2501', error: null })
    insertSingle.mockResolvedValueOnce({ data: arendeRad('NIT-2501'), error: null })
    forsokSkapaKundportalKontoMock.mockResolvedValue(undefined)

    const arende = await skapaOperativtArende(giltigaUppgifter)

    expect(arende.arendenummer).toBe('NIT-2501')
    expect(forsokSkickaValkomstmejlMock).not.toHaveBeenCalled()
  })
})
