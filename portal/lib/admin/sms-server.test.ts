import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const arendeSingle = vi.fn()
const arendeEq = vi.fn(() => ({ single: arendeSingle }))
const arendeSelect = vi.fn(() => ({ eq: arendeEq }))

const aktivitetInsert = vi.fn().mockResolvedValue({ error: null })

const from = vi.fn((table: string) => {
  if (table === 'admin_arenden') return { select: arendeSelect }
  if (table === 'admin_aktiviteter') return { insert: aktivitetInsert }
  throw new Error(`Oväntad tabell i test: ${table}`)
})

vi.mock('@/lib/supabase/service', () => ({
  skapaSupabaseServiceklient: () => ({ from }),
}))

let skickaKlarForUpphamtningSms: typeof import('@/lib/admin/sms-server').skickaKlarForUpphamtningSms
let normaliseraSvensktMobilnummer: typeof import('@/lib/admin/sms-server').normaliseraSvensktMobilnummer
let OperativtAdminFel: typeof import('@/lib/admin/operativa-server').OperativtAdminFel

beforeAll(async () => {
  ;({ skickaKlarForUpphamtningSms, normaliseraSvensktMobilnummer } = await import(
    '@/lib/admin/sms-server'
  ))
  ;({ OperativtAdminFel } = await import('@/lib/admin/operativa-server'))
})

const ENV_NYCKLAR = ['ELKS_API_USERNAME', 'ELKS_API_PASSWORD', 'SMS_AVSANDARE'] as const
const ursprungligEnv: Record<string, string | undefined> = {}
let ursprungligFetch: typeof fetch

beforeEach(() => {
  for (const nyckel of ENV_NYCKLAR) ursprungligEnv[nyckel] = process.env[nyckel]
  process.env.ELKS_API_USERNAME = 'test-user'
  process.env.ELKS_API_PASSWORD = 'test-pass'
  delete process.env.SMS_AVSANDARE
  ursprungligFetch = globalThis.fetch
})

afterEach(() => {
  for (const nyckel of ENV_NYCKLAR) {
    if (ursprungligEnv[nyckel] === undefined) delete process.env[nyckel]
    else process.env[nyckel] = ursprungligEnv[nyckel]
  }
  globalThis.fetch = ursprungligFetch
  vi.clearAllMocks()
})

function jsonSvar(status = 200) {
  return new Response('{"id":"s1"}', { status }) as Response & { ok: boolean }
}

describe('skickaKlarForUpphamtningSms', () => {
  it('kastar ett tydligt, känt fel om 46elks-nycklarna inte är konfigurerade', async () => {
    delete process.env.ELKS_API_USERNAME
    delete process.env.ELKS_API_PASSWORD

    await expect(skickaKlarForUpphamtningSms('arende-1', 'Admin')).rejects.toThrow(
      OperativtAdminFel,
    )
  })

  it('kastar 404 om ärendet inte hittas', async () => {
    arendeSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })

    await expect(skickaKlarForUpphamtningSms('arende-saknas', 'Admin')).rejects.toMatchObject({
      status: 404,
    })
  })

  it('kastar 422 om ärendets telefonnummer inte går att tolka', async () => {
    arendeSingle.mockResolvedValue({
      data: { id: 'arende-1', arendenummer: 'NIT-2501', telefon: 'inte-ett-nummer' },
      error: null,
    })

    await expect(skickaKlarForUpphamtningSms('arende-1', 'Admin')).rejects.toMatchObject({
      status: 422,
    })
  })

  it('skickar SMS via 46elks och loggar en aktivitet vid lyckat utskick', async () => {
    arendeSingle.mockResolvedValue({
      data: { id: 'arende-1', arendenummer: 'NIT-2501', telefon: '070-448 58 78' },
      error: null,
    })

    const fetchAnrop: { url: string; init?: RequestInit }[] = []
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      fetchAnrop.push({ url: String(input), init })
      return jsonSvar(200)
    }) as unknown as typeof fetch

    const resultat = await skickaKlarForUpphamtningSms('arende-1', 'Admin Nova')

    expect(resultat).toEqual({ skickat: true, till: '+46704485878' })
    expect(fetchAnrop).toHaveLength(1)
    expect(fetchAnrop[0].url).toBe('https://api.46elks.com/a1/sms')
    expect(fetchAnrop[0].init?.method).toBe('POST')
    const body = new URLSearchParams(String(fetchAnrop[0].init?.body))
    expect(body.get('to')).toBe('+46704485878')
    expect(body.get('from')).toBe('NovaIT')
    expect(body.get('message')).toContain('NIT-2501')

    expect(aktivitetInsert).toHaveBeenCalledWith(
      expect.objectContaining({ arende_id: 'arende-1', typ: 'sms', aktor: 'Admin Nova' }),
    )
  })

  it('använder SMS_AVSANDARE som avsändare när den är satt', async () => {
    process.env.SMS_AVSANDARE = 'MittFöretag'
    arendeSingle.mockResolvedValue({
      data: { id: 'arende-1', arendenummer: 'NIT-2501', telefon: '0704485878' },
      error: null,
    })

    let skickatFran: string | null = null
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      skickatFran = new URLSearchParams(String(init?.body)).get('from')
      return jsonSvar(200)
    }) as unknown as typeof fetch

    await skickaKlarForUpphamtningSms('arende-1', 'Admin')
    expect(skickatFran).toBe('MittFöretag')
  })

  it('kastar 502 och läcker inga interna detaljer om 46elks avvisar utskicket', async () => {
    arendeSingle.mockResolvedValue({
      data: { id: 'arende-1', arendenummer: 'NIT-2501', telefon: '0704485878' },
      error: null,
    })
    globalThis.fetch = (async () => jsonSvar(401)) as unknown as typeof fetch

    await expect(skickaKlarForUpphamtningSms('arende-1', 'Admin')).rejects.toMatchObject({
      status: 502,
    })
    expect(aktivitetInsert).not.toHaveBeenCalled()
  })

  it('kastar 502 om 46elks inte kan nås alls', async () => {
    arendeSingle.mockResolvedValue({
      data: { id: 'arende-1', arendenummer: 'NIT-2501', telefon: '0704485878' },
      error: null,
    })
    globalThis.fetch = (async () => {
      throw new Error('connection refused')
    }) as unknown as typeof fetch

    await expect(skickaKlarForUpphamtningSms('arende-1', 'Admin')).rejects.toMatchObject({
      status: 502,
    })
  })
})

describe('normaliseraSvensktMobilnummer', () => {
  it('normaliserar vanliga svenska format till +46-format', () => {
    expect(normaliseraSvensktMobilnummer('070-448 58 78')).toBe('+46704485878')
    expect(normaliseraSvensktMobilnummer('0704485878')).toBe('+46704485878')
    expect(normaliseraSvensktMobilnummer('+46 70 448 58 78')).toBe('+46704485878')
    expect(normaliseraSvensktMobilnummer('0046704485878')).toBe('+46704485878')
    expect(normaliseraSvensktMobilnummer('46704485878')).toBe('+46704485878')
  })

  it('returnerar null för ogiltiga eller otolkbara nummer', () => {
    expect(normaliseraSvensktMobilnummer('inte ett nummer')).toBeNull()
    expect(normaliseraSvensktMobilnummer('123')).toBeNull()
    expect(normaliseraSvensktMobilnummer('')).toBeNull()
  })
})
