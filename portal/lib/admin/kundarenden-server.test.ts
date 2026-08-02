import { beforeEach, describe, expect, it, vi } from 'vitest'

const arendenListRad = { data: null as unknown, error: null as unknown }
const arendeRad = { data: null as unknown, error: null as unknown }
const meddelandenListRad = { data: null as unknown, error: null as unknown }
const meddelandeInsertRad = { data: null as unknown, error: null as unknown }
const updateSpy = vi.fn()
const aktivitetInsertSpy = vi.fn()
const arendeFilterSpy = vi.fn()

function skapaArendeFilterfraga() {
  const fraga = {
    eq: vi.fn((kolumn: string, varde: string) => {
      arendeFilterSpy(kolumn, varde)
      return fraga
    }),
    maybeSingle: vi.fn(() => Promise.resolve(arendeRad)),
  }
  return fraga
}

const service = {
  from: vi.fn((table: string) => {
    if (table === 'admin_arenden') {
      return {
        select: vi.fn((valda: string) => ({
          eq: vi.fn((kolumn: string, varde: string) => {
            if (valda.includes('kund_id')) {
              const fraga = skapaArendeFilterfraga()
              return fraga.eq(kolumn, varde)
            }
            return { order: vi.fn(() => Promise.resolve(arendenListRad)) }
          }),
        })),
        update: vi.fn((payload: unknown) => {
          updateSpy(payload)
          return { eq: vi.fn(() => Promise.resolve({ error: null })) }
        }),
      }
    }
    if (table === 'admin_meddelanden') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ order: vi.fn(() => Promise.resolve(meddelandenListRad)) })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve(meddelandeInsertRad)) })),
        })),
      }
    }
    if (table === 'admin_kunder') {
      return { update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })) }
    }
    if (table === 'admin_aktiviteter') {
      return {
        insert: vi.fn((payload: unknown) => {
          aktivitetInsertSpy(payload)
          return Promise.resolve({ error: null })
        }),
      }
    }
    throw new Error(`Oväntad tabell: ${table}`)
  }),
}

vi.mock('@/lib/supabase/service', () => ({
  skapaSupabaseServiceklient: () => service,
}))

describe('hamtaKundArenden', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    arendenListRad.data = null
    arendenListRad.error = null
  })

  it('returnerar kundens ärenden', async () => {
    arendenListRad.data = [
      {
        id: 'arende-1',
        arendenummer: 'NIT-1001',
        rubrik: 'Wi-Fi',
        status: 'pagaende',
        prioritet: 'normal',
        skapad: '2026-07-29T10:00:00.000Z',
        uppdaterad: '2026-07-29T10:00:00.000Z',
      },
    ]

    const { hamtaKundArenden } = await import('./kundarenden-server')
    const arenden = await hamtaKundArenden('kund-1')

    expect(arenden).toHaveLength(1)
    expect(arenden[0].arendenummer).toBe('NIT-1001')
  })

  it('kastar KundArendeFel vid databasfel', async () => {
    arendenListRad.error = { message: 'db-fel' }

    const { hamtaKundArenden, KundArendeFel } = await import('./kundarenden-server')
    await expect(hamtaKundArenden('kund-1')).rejects.toBeInstanceOf(KundArendeFel)
  })
})

describe('hamtaKundArende', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    arendeRad.data = null
    arendeRad.error = null
    meddelandenListRad.data = []
    meddelandenListRad.error = null
  })

  it('returnerar null om ärendet inte tillhör kunden', async () => {
    arendeRad.data = null

    const { hamtaKundArende } = await import('./kundarenden-server')
    const resultat = await hamtaKundArende('kund-1', 'arende-1')

    expect(resultat).toBeNull()
    expect(arendeFilterSpy).toHaveBeenCalledWith('id', 'arende-1')
    expect(arendeFilterSpy).toHaveBeenCalledWith('kund_id', 'kund-1')
  })

  it('returnerar null om ärendet inte finns', async () => {
    arendeRad.data = null

    const { hamtaKundArende } = await import('./kundarenden-server')
    const resultat = await hamtaKundArende('kund-1', 'arende-saknas')

    expect(resultat).toBeNull()
  })

  it('returnerar ärendet med konversation vid rätt kund', async () => {
    arendeRad.data = {
      id: 'arende-1',
      arendenummer: 'NIT-1001',
      rubrik: 'Wi-Fi',
      status: 'pagaende',
      prioritet: 'normal',
      skapad: '2026-07-29T10:00:00.000Z',
      uppdaterad: '2026-07-29T10:00:00.000Z',
      kund_id: 'kund-1',
    }
    meddelandenListRad.data = [
      {
        id: 'm1',
        avsandare: 'kund',
        avsandare_namn: 'Anna Andersson',
        text: 'Wi-Fi faller bort.',
        tidpunkt: '2026-07-29T10:00:00.000Z',
      },
    ]

    const { hamtaKundArende } = await import('./kundarenden-server')
    const resultat = await hamtaKundArende('kund-1', 'arende-1')

    expect(resultat?.meddelanden).toHaveLength(1)
    expect(resultat?.meddelanden[0].avsandareNamn).toBe('Anna Andersson')
  })
})

describe('skapaKundMeddelande', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    arendeRad.data = null
    arendeRad.error = null
    meddelandeInsertRad.data = null
    meddelandeInsertRad.error = null
  })

  const uppgifter = { adminKundId: 'kund-1', arendeId: 'arende-1', text: 'Tack, det löste sig!' }

  it('avvisar tomma meddelanden utan att nå databasen', async () => {
    const { skapaKundMeddelande, KundArendeFel } = await import('./kundarenden-server')
    await expect(skapaKundMeddelande({ ...uppgifter, text: '   ' })).rejects.toBeInstanceOf(
      KundArendeFel,
    )
  })

  it('nekar (404) om ärendet tillhör en annan kund', async () => {
    arendeRad.data = null

    const { skapaKundMeddelande, KundArendeFel } = await import('./kundarenden-server')
    try {
      await skapaKundMeddelande(uppgifter)
      throw new Error('skulle ha kastat')
    } catch (fel) {
      expect(fel).toBeInstanceOf(KundArendeFel)
      expect((fel as InstanceType<typeof KundArendeFel>).status).toBe(404)
    }
    expect(arendeFilterSpy).toHaveBeenCalledWith('id', 'arende-1')
    expect(arendeFilterSpy).toHaveBeenCalledWith('kund_id', 'kund-1')
  })

  it('nekar (409) om ärendet är stängt', async () => {
    arendeRad.data = { id: 'arende-1', kund_id: 'kund-1', kund_namn: 'Anna', status: 'stangd' }

    const { skapaKundMeddelande, KundArendeFel } = await import('./kundarenden-server')
    try {
      await skapaKundMeddelande(uppgifter)
      throw new Error('skulle ha kastat')
    } catch (fel) {
      expect(fel).toBeInstanceOf(KundArendeFel)
      expect((fel as InstanceType<typeof KundArendeFel>).status).toBe(409)
    }
  })

  it('sparar meddelandet och flyttar ärendet från väntar_pa_kund till pagaende', async () => {
    arendeRad.data = { id: 'arende-1', kund_id: 'kund-1', kund_namn: 'Anna Andersson', status: 'vantar_pa_kund' }
    meddelandeInsertRad.data = {
      id: 'm1',
      avsandare: 'kund',
      avsandare_namn: 'Anna Andersson',
      text: uppgifter.text,
      tidpunkt: '2026-07-29T10:00:00.000Z',
    }

    const { skapaKundMeddelande } = await import('./kundarenden-server')
    const meddelande = await skapaKundMeddelande(uppgifter)

    expect(meddelande.text).toBe(uppgifter.text)
    expect(updateSpy).toHaveBeenCalledWith({ status: 'pagaende' })
    expect(aktivitetInsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ arende_id: 'arende-1', typ: 'meddelande' }),
    )
  })

  it('behåller ärendets status om det inte väntade på kunden', async () => {
    arendeRad.data = { id: 'arende-1', kund_id: 'kund-1', kund_namn: 'Anna Andersson', status: 'pagaende' }
    meddelandeInsertRad.data = {
      id: 'm1',
      avsandare: 'kund',
      avsandare_namn: 'Anna Andersson',
      text: uppgifter.text,
      tidpunkt: '2026-07-29T10:00:00.000Z',
    }

    const { skapaKundMeddelande } = await import('./kundarenden-server')
    await skapaKundMeddelande(uppgifter)

    expect(updateSpy).toHaveBeenCalledWith({ status: 'pagaende' })
  })
})
