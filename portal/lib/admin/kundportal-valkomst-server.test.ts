import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const ENV_NYCKLAR = ['RESEND_API_KEY', 'ARENDE_AVISERING_FROM', 'KUNDPORTAL_URL'] as const
const ursprungligEnv: Record<string, string | undefined> = {}
let ursprungligFetch: typeof fetch

beforeEach(() => {
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
  epost: 'anna@example.se',
  kundNamn: 'Anna Andersson',
  tillfalligtLosenord: 'ett-tillfalligt-losenord',
}

describe('forsokSkickaValkomstmejl', () => {
  it('gör inget anrop (soft-fail) om RESEND_API_KEY eller ARENDE_AVISERING_FROM saknas', async () => {
    delete process.env.RESEND_API_KEY
    delete process.env.ARENDE_AVISERING_FROM
    let fetchAnropad = false
    globalThis.fetch = (async () => {
      fetchAnropad = true
      throw new Error('ska inte anropas')
    }) as unknown as typeof fetch

    const { forsokSkickaValkomstmejl } = await import('./kundportal-valkomst-server')
    await expect(forsokSkickaValkomstmejl(uppgifter)).resolves.toBe(false)
    expect(fetchAnropad).toBe(false)
  })

  it('postar till Resend med kundens e-post och det tillfälliga lösenordet', async () => {
    process.env.RESEND_API_KEY = 'test-nyckel'
    process.env.ARENDE_AVISERING_FROM = 'Nova IT <no-reply@nova-it.se>'
    const anrop: { url: string; init?: RequestInit }[] = []
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      anrop.push({ url: String(input), init })
      return new Response(JSON.stringify({}), { status: 200 })
    }) as unknown as typeof fetch

    const { forsokSkickaValkomstmejl } = await import('./kundportal-valkomst-server')
    await expect(forsokSkickaValkomstmejl(uppgifter)).resolves.toBe(true)

    expect(anrop[0]?.url).toBe('https://api.resend.com/emails')
    const body = JSON.parse(String(anrop[0]?.init?.body))
    expect(body.to).toEqual(['anna@example.se'])
    expect(body.text).toContain('ett-tillfalligt-losenord')
    expect(body.text).toContain('https://kundportal.nova-it.se/logga-in')
    expect(body.text).not.toContain('E-post:')
  })

  it('inkluderar ärendenummer i mejlet när det anges (manuellt skapat ärende)', async () => {
    process.env.RESEND_API_KEY = 'test-nyckel'
    process.env.ARENDE_AVISERING_FROM = 'Nova IT <no-reply@nova-it.se>'
    const anrop: { url: string; init?: RequestInit }[] = []
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      anrop.push({ url: String(input), init })
      return new Response(JSON.stringify({}), { status: 200 })
    }) as unknown as typeof fetch

    const { forsokSkickaValkomstmejl } = await import('./kundportal-valkomst-server')
    await forsokSkickaValkomstmejl({ ...uppgifter, arendenummer: 'NIT-2026-0042' })

    const body = JSON.parse(String(anrop[0]?.init?.body))
    expect(body.text).toContain('NIT-2026-0042')
    expect(body.text).toContain('ett-tillfalligt-losenord')
    expect(body.text).toContain('https://kundportal.nova-it.se/logga-in')
  })

  it('soft-failar (kastar aldrig) om Resend svarar med fel eller inte kan nås', async () => {
    process.env.RESEND_API_KEY = 'test-nyckel'
    process.env.ARENDE_AVISERING_FROM = 'Nova IT <no-reply@nova-it.se>'
    globalThis.fetch = (async () => {
      throw new Error('connection refused')
    }) as unknown as typeof fetch

    const { forsokSkickaValkomstmejl } = await import('./kundportal-valkomst-server')
    await expect(forsokSkickaValkomstmejl(uppgifter)).resolves.toBe(false)
  })
})
