import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Regressionstest för en bugg upptäckt manuellt: när ett nytt ärende kommer
 * in från en REDAN KÄND e-postadress (samma kund som tidigare), men med ett
 * NYTT telefonnummer i just den här inskickningen, återanvändes tidigare
 * det gamla, lagrade telefonnumret på både kundraden och det nya ärendet -
 * SMS ("klart för upphämtning") gick då till fel persons telefon. Se
 * hittaEllerSkapaKund() i publikt-intag-server.ts.
 */

const profileRows = vi.fn()
const arendeInsert = vi.fn()
const arendeSingle = vi.fn()
const kundUpdate = vi.fn()
const rpc = vi.fn()

const GAMMAL_KUND = {
  id: 'kund-1',
  namn: 'Test Kund',
  kundtyp: 'privatperson',
  epost: 'test@example.com',
  telefon: '070-0000000',
  organisation: null,
}

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
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: GAMMAL_KUND, error: null })),
          })),
        })),
        update: vi.fn((payload: unknown) => {
          kundUpdate(payload)
          return { eq: vi.fn(() => Promise.resolve({ error: null })) }
        }),
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

describe('skapaPubliktIntag – telefonnummer vid känd kund', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    profileRows.mockReturnValue([
      { id: 'support-id', namn: 'Nova IT Support', epost: 'support@nova-it.se', roll: 'medarbetare', aktiv: true },
    ])
    rpc.mockResolvedValue({ data: 'NIT-4001', error: null })
    arendeSingle.mockResolvedValue({
      data: { id: 'arende-1', arendenummer: 'NIT-4001', skapad: new Date().toISOString() },
      error: null,
    })
  })

  it('använder det NYA telefonnumret på ärendet, inte kundens gamla lagrade nummer', async () => {
    const { skapaPubliktIntag } = await import('@/lib/admin/publikt-intag-server')

    await skapaPubliktIntag({
      kalla: 'kontaktformular',
      namn: 'Test Kund',
      epost: 'test@example.com',
      telefon: '070-9999999',
      kundtyp: 'privatperson',
      tjanstSlug: 'it-support',
      angelagenhet: 'normal',
      meddelande: 'Detta är en tillräckligt lång testförfrågan.',
      idempotensnyckel: 'test-intag-telefon-1234567890',
    })

    expect(arendeInsert).toHaveBeenCalledWith(
      expect.objectContaining({ telefon: '070-9999999', kund_id: 'kund-1' }),
    )
    expect(kundUpdate).toHaveBeenCalledWith({ telefon: '070-9999999' })
  })

  it('uppdaterar INTE kundraden om samma telefonnummer skickas in igen', async () => {
    const { skapaPubliktIntag } = await import('@/lib/admin/publikt-intag-server')

    await skapaPubliktIntag({
      kalla: 'kontaktformular',
      namn: 'Test Kund',
      epost: 'test@example.com',
      telefon: GAMMAL_KUND.telefon,
      kundtyp: 'privatperson',
      tjanstSlug: 'it-support',
      angelagenhet: 'normal',
      meddelande: 'Detta är en tillräckligt lång testförfrågan.',
      idempotensnyckel: 'test-intag-telefon-samma-1234567890',
    })

    expect(kundUpdate).not.toHaveBeenCalledWith(expect.objectContaining({ telefon: expect.anything() }))
    expect(arendeInsert).toHaveBeenCalledWith(
      expect.objectContaining({ telefon: GAMMAL_KUND.telefon }),
    )
  })
})
