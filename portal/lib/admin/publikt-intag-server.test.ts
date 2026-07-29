import { beforeEach, describe, expect, it, vi } from 'vitest'

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
})
