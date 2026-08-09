import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const ENV_NYCKLAR = ['KUNDPORTAL_URL', 'KUNDPORTAL_INTAG_SECRET'] as const
const ursprungligEnv: Record<string, string | undefined> = {}
let ursprungligFetch: typeof fetch
let ursprungligConsoleError: typeof console.error

beforeEach(() => {
  for (const nyckel of ENV_NYCKLAR) ursprungligEnv[nyckel] = process.env[nyckel]
  ursprungligFetch = globalThis.fetch
  ursprungligConsoleError = console.error
})

afterEach(() => {
  for (const nyckel of ENV_NYCKLAR) {
    if (ursprungligEnv[nyckel] === undefined) delete process.env[nyckel]
    else process.env[nyckel] = ursprungligEnv[nyckel]
  }
  globalThis.fetch = ursprungligFetch
  console.error = ursprungligConsoleError
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

describe('forsokSkapaKundportalKonto', () => {
  it('returnerar undefined (soft-fail) om KUNDPORTAL_URL eller KUNDPORTAL_INTAG_SECRET saknas, utan att anropa fetch', async () => {
    delete process.env.KUNDPORTAL_URL
    delete process.env.KUNDPORTAL_INTAG_SECRET
    let fetchAnropad = false
    globalThis.fetch = (async () => {
      fetchAnropad = true
      throw new Error('ska inte anropas')
    }) as unknown as typeof fetch

    const { forsokSkapaKundportalKonto } = await import('./kundportal-konto-client')
    const resultat = await forsokSkapaKundportalKonto('kund-1', 'test@example.se')

    expect(resultat).toBeUndefined()
    expect(fetchAnropad).toBe(false)
  })

  it('returnerar kontoresultatet vid lyckat anrop', async () => {
    process.env.KUNDPORTAL_URL = 'https://kundportal.nova-it.se'
    process.env.KUNDPORTAL_INTAG_SECRET = 'test-hemlighet'
    globalThis.fetch = (async () =>
      jsonResponse({ ok: true, kontoSkapat: true, tillfalligtLosenord: 'hemligt123' })) as unknown as typeof fetch

    const { forsokSkapaKundportalKonto } = await import('./kundportal-konto-client')
    const resultat = await forsokSkapaKundportalKonto('kund-1', 'test@example.se')

    expect(resultat).toEqual({ kontoSkapat: true, tillfalligtLosenord: 'hemligt123' })
  })

  it('returnerar undefined om kundportalen svarar med fel, och loggar ALDRIG hela svarskroppen (kan innehålla lösenord)', async () => {
    process.env.KUNDPORTAL_URL = 'https://kundportal.nova-it.se'
    process.env.KUNDPORTAL_INTAG_SECRET = 'test-hemlighet'
    globalThis.fetch = (async () =>
      jsonResponse({ ok: false, tillfalligtLosenord: 'skarpt-hemligt' }, 500)) as unknown as typeof fetch

    const loggat: unknown[] = []
    console.error = (...args: unknown[]) => {
      loggat.push(args)
    }

    const { forsokSkapaKundportalKonto } = await import('./kundportal-konto-client')
    const resultat = await forsokSkapaKundportalKonto('kund-1', 'test@example.se')

    expect(resultat).toBeUndefined()
    const loggadText = JSON.stringify(loggat)
    expect(loggadText).not.toContain('skarpt-hemligt')
  })

  it('returnerar undefined om kundportalen inte kan nås', async () => {
    process.env.KUNDPORTAL_URL = 'https://kundportal.nova-it.se'
    process.env.KUNDPORTAL_INTAG_SECRET = 'test-hemlighet'
    globalThis.fetch = (async () => {
      throw new Error('connection refused')
    }) as unknown as typeof fetch

    const { forsokSkapaKundportalKonto } = await import('./kundportal-konto-client')
    await expect(forsokSkapaKundportalKonto('kund-1', 'test@example.se')).resolves.toBeUndefined()
  })

  it('skickar anropet med en tidsgräns (AbortSignal) så ett hängande anrop inte blockerar för alltid', async () => {
    process.env.KUNDPORTAL_URL = 'https://kundportal.nova-it.se'
    process.env.KUNDPORTAL_INTAG_SECRET = 'test-hemlighet'
    let sedSignal: AbortSignal | undefined
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      sedSignal = init?.signal ?? undefined
      return jsonResponse({ ok: true, kontoSkapat: false })
    }) as unknown as typeof fetch

    const { forsokSkapaKundportalKonto } = await import('./kundportal-konto-client')
    await forsokSkapaKundportalKonto('kund-1', 'test@example.se')

    expect(sedSignal).toBeInstanceOf(AbortSignal)
  })
})

describe('forsokHamtaKundkontoStatus', () => {
  it('returnerar undefined (soft-fail) om KUNDPORTAL_URL eller KUNDPORTAL_INTAG_SECRET saknas', async () => {
    delete process.env.KUNDPORTAL_URL
    delete process.env.KUNDPORTAL_INTAG_SECRET

    const { forsokHamtaKundkontoStatus } = await import('./kundportal-konto-client')
    const resultat = await forsokHamtaKundkontoStatus('kund-1')

    expect(resultat).toBeUndefined()
  })

  it('returnerar statusen vid lyckat anrop', async () => {
    process.env.KUNDPORTAL_URL = 'https://kundportal.nova-it.se'
    process.env.KUNDPORTAL_INTAG_SECRET = 'test-hemlighet'
    globalThis.fetch = (async () =>
      jsonResponse({
        ok: true,
        kontoFinns: true,
        masteBytaLosenord: false,
        senastInloggad: '2026-08-01T10:00:00.000Z',
      })) as unknown as typeof fetch

    const { forsokHamtaKundkontoStatus } = await import('./kundportal-konto-client')
    const resultat = await forsokHamtaKundkontoStatus('kund-1')

    expect(resultat).toEqual({
      kontoFinns: true,
      masteBytaLosenord: false,
      senastInloggad: '2026-08-01T10:00:00.000Z',
    })
  })

  it('returnerar undefined om kundportalen svarar med fel', async () => {
    process.env.KUNDPORTAL_URL = 'https://kundportal.nova-it.se'
    process.env.KUNDPORTAL_INTAG_SECRET = 'test-hemlighet'
    globalThis.fetch = (async () => jsonResponse({ ok: false }, 500)) as unknown as typeof fetch

    const { forsokHamtaKundkontoStatus } = await import('./kundportal-konto-client')
    await expect(forsokHamtaKundkontoStatus('kund-1')).resolves.toBeUndefined()
  })

  it('returnerar undefined om kundportalen inte kan nås', async () => {
    process.env.KUNDPORTAL_URL = 'https://kundportal.nova-it.se'
    process.env.KUNDPORTAL_INTAG_SECRET = 'test-hemlighet'
    globalThis.fetch = (async () => {
      throw new Error('connection refused')
    }) as unknown as typeof fetch

    const { forsokHamtaKundkontoStatus } = await import('./kundportal-konto-client')
    await expect(forsokHamtaKundkontoStatus('kund-1')).resolves.toBeUndefined()
  })
})
