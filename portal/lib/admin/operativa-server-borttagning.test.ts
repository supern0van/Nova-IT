import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Verifierar taBortOperativArenden() och taBortOperativKund(). Kundborttagning
 * sker via en Postgres-funktion (ta_bort_kund_kaskad) så att bokningar,
 * ärenden och kundraden tas bort i EN atomär transaktion - se migrationen
 * ta_bort_kund_kaskad_rpc. Detta test verifierar att rätt RPC anropas med
 * rätt argument och att fel/not-found hanteras korrekt, inte
 * transaktionaliteten i sig (det är databasens jobb). Verifierar även att
 * kundportalskontot spärras (se forsokTaBortKundportalKonto) FÖRE den
 * lokala raderingen.
 */

const arendeDeleteEq = vi.fn().mockResolvedValue({ error: null })
const arendeDeleteIn = vi.fn(() => arendeDeleteEq())
const rpc = vi.fn().mockResolvedValue({ error: null })
const forsokTaBortKundportalKonto = vi.fn().mockResolvedValue(undefined)

const from = vi.fn((table: string) => {
  if (table === 'admin_arenden') {
    return { delete: vi.fn(() => ({ eq: arendeDeleteIn, in: arendeDeleteIn })) }
  }
  throw new Error(`Oväntad tabell i test: ${table}`)
})

vi.mock('@/lib/supabase/service', () => ({
  skapaSupabaseServiceklient: () => ({ from, rpc }),
}))

vi.mock('@/lib/admin/kundportal-konto-client', () => ({
  forsokSkapaKundportalKonto: vi.fn(),
  forsokTaBortKundportalKonto,
}))

let taBortOperativArenden: typeof import('@/lib/admin/operativa-server').taBortOperativArenden
let taBortOperativKund: typeof import('@/lib/admin/operativa-server').taBortOperativKund
let OperativtAdminFel: typeof import('@/lib/admin/operativa-server').OperativtAdminFel

beforeAll(async () => {
  ;({ taBortOperativArenden, taBortOperativKund, OperativtAdminFel } = await import(
    '@/lib/admin/operativa-server'
  ))
})

beforeEach(() => {
  rpc.mockClear()
  rpc.mockResolvedValue({ error: null })
  forsokTaBortKundportalKonto.mockClear()
  forsokTaBortKundportalKonto.mockResolvedValue(undefined)
})

describe('taBortOperativArenden', () => {
  it('tar bort de angivna ärendena', async () => {
    const resultat = await taBortOperativArenden(['arende-1', 'arende-2'])

    expect(resultat).toEqual(['arende-1', 'arende-2'])
    expect(arendeDeleteIn).toHaveBeenCalledWith('id', ['arende-1', 'arende-2'])
  })

  it('kastar OperativtAdminFel om inga giltiga id:n ges', async () => {
    await expect(taBortOperativArenden([])).rejects.toBeInstanceOf(OperativtAdminFel)
    await expect(taBortOperativArenden(['', '  '])).rejects.toBeInstanceOf(OperativtAdminFel)
  })
})

describe('taBortOperativKund', () => {
  it('anropar den atomära ta_bort_kund_kaskad-RPC:n med kund-id', async () => {
    const resultat = await taBortOperativKund('kund-1')

    expect(resultat).toBe('kund-1')
    expect(rpc).toHaveBeenCalledWith('ta_bort_kund_kaskad', { p_kund_id: 'kund-1' })
  })

  it('spärrar kundportalskontot FÖRE den lokala raderingen', async () => {
    const ordning: string[] = []
    forsokTaBortKundportalKonto.mockImplementation(async () => {
      ordning.push('kundportal')
    })
    rpc.mockImplementation(async () => {
      ordning.push('rpc')
      return { error: null }
    })

    await taBortOperativKund('kund-1')

    expect(forsokTaBortKundportalKonto).toHaveBeenCalledWith('kund-1')
    expect(ordning).toEqual(['kundportal', 'rpc'])
  })

  it('fortsätter ändå med den lokala raderingen om kundportalen inte kan nås (soft-fail)', async () => {
    // Samma resonemang som kontoSKAPANDET (forsokSkapaKundportalKonto): en
    // oåtkomlig kundportal ska aldrig blockera adminportalens egen åtgärd.
    forsokTaBortKundportalKonto.mockResolvedValue(undefined)

    const resultat = await taBortOperativKund('kund-1')

    expect(resultat).toBe('kund-1')
    expect(rpc).toHaveBeenCalled()
  })

  it('kastar OperativtAdminFel 404 om RPC:n signalerar att kunden inte hittades (P0002)', async () => {
    rpc.mockResolvedValue({ error: { code: 'P0002', message: 'Kunden hittades inte' } })

    const fel = await taBortOperativKund('okant-id').catch((e) => e)

    expect(fel).toBeInstanceOf(OperativtAdminFel)
    expect(fel.status).toBe(404)
  })

  it('kastar ett generellt Error för övriga databasfel från RPC:n', async () => {
    rpc.mockResolvedValue({ error: { code: '23503', message: 'foreign key violation' } })

    await expect(taBortOperativKund('kund-1')).rejects.toBeInstanceOf(Error)
  })

  it('kastar Error om kund-id saknas, utan att anropa RPC:n', async () => {
    await expect(taBortOperativKund('')).rejects.toBeInstanceOf(Error)
    expect(rpc).not.toHaveBeenCalled()
  })
})
