// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Skyddar kravet "faller aldrig tyst tillbaka till localStorage/demo-data i
 * produktion". Skriv-vägarna i store.ts går via ett delat API-lager som ska
 * kasta i produktion men får behålla demoflödet lokalt – utan tester är den
 * skillnaden lätt att råka bygga bort.
 */

async function laddaStore() {
  vi.resetModules()
  return import('@/lib/store')
}

function svaraMed(kropp: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => kropp,
  } as Response
}

const nyKund = {
  namn: 'Birgitta Sandell',
  kundtyp: 'privatperson' as const,
  epost: 'birgitta@exempel.se',
  telefon: '070-000 00 00',
  adress: 'Loviselundsvägen 42',
  ort: 'Hässelby',
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('store – operativa skrivvägar i produktion', () => {
  it('kastar i stället för att spara demo-data lokalt när API:t inte går att nå', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down')),
    )
    const { skapaKund } = await laddaStore()

    await expect(skapaKund(nyKund, 'Admin Nova')).rejects.toThrow(
      'Kunde inte nå det operativa API:t.',
    )
  })

  it('kastar när servern nekar anropet, i stället för att skriva lokalt', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(svaraMed({ ok: false }, false, 403)))
    const { skapaKund } = await laddaStore()

    await expect(skapaKund(nyKund, 'Admin Nova')).rejects.toThrow(
      'Kunde inte spara i den operativa databasen.',
    )
  })

  it('kastar när servern svarar med oväntat format', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(svaraMed({ ok: true })))
    const { skapaKund } = await laddaStore()

    await expect(skapaKund(nyKund, 'Admin Nova')).rejects.toThrow(
      'Servern returnerade ett oväntat svar.',
    )
  })

  it('lägger inte till kunden i den lokala databasen när skrivningen misslyckas', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const { skapaKund, hamtaDatabas } = await laddaStore()

    // Eget namn: demo-seeden innehåller redan "Birgitta Sandell", så ett
    // namnbaserat påstående måste använda något som bara detta test skapar.
    const unikKund = { ...nyKund, namn: 'Testkund Utan Motsvarighet I Seeden' }
    const innan = hamtaDatabas().kunder.length
    await expect(skapaKund(unikKund, 'Admin Nova')).rejects.toThrow()

    expect(hamtaDatabas().kunder.length).toBe(innan)
    expect(hamtaDatabas().kunder.some((k) => k.namn === unikKund.namn)).toBe(false)
  })

  it('returnerar serverns kund – inte en lokalt genererad – vid lyckad skrivning', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const serverKund = {
      id: 'kund-fran-servern',
      namn: 'Birgitta Sandell',
      kundtyp: 'privatperson',
      epost: 'birgitta@exempel.se',
      telefon: '070-000 00 00',
      adress: 'Loviselundsvägen 42',
      ort: 'Hässelby',
      senasteKontakt: '2026-07-28T00:00:00.000Z',
      skapad: '2026-07-28T00:00:00.000Z',
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(svaraMed({ ok: true, kund: serverKund })),
    )
    const { skapaKund } = await laddaStore()

    const kund = await skapaKund(nyKund, 'Admin Nova')

    expect(kund.id).toBe('kund-fran-servern')
  })

  it('skickar skrivningen till det skyddade admin-API:t', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const fetchMock = vi.fn().mockResolvedValue(
      svaraMed({
        ok: true,
        kund: { ...nyKund, id: 'k-1', senasteKontakt: '', skapad: '' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { skapaKund } = await laddaStore()

    await skapaKund(nyKund, 'Admin Nova')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/admin/operativt')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body).typ).toBe('skapa_kund')
  })
})

describe('store – lokal utveckling behåller demoflödet', () => {
  it('faller tillbaka till den lokala demodatabasen när API:t inte går att nå', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const { skapaKund, hamtaDatabas } = await laddaStore()

    const kund = await skapaKund(nyKund, 'Admin Nova')

    expect(kund.namn).toBe(nyKund.namn)
    expect(hamtaDatabas().kunder.some((k) => k.id === kund.id)).toBe(true)
  })

  it('kastar även lokalt när servern faktiskt svarar med ett fel', async () => {
    // Ett nått men nekande API är ett riktigt fel även i utveckling – bara
    // oanträffbart API får falla tillbaka på demoflödet.
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(svaraMed({ ok: false }, false, 403)))
    const { skapaKund } = await laddaStore()

    await expect(skapaKund(nyKund, 'Admin Nova')).rejects.toThrow(
      'Kunde inte spara i den operativa databasen.',
    )
  })
})

describe('store – borttagning är aldrig ett tyst lokalt "lyckande"', () => {
  it('taBortKund kastar och rör INTE den lokala cachen om API:t inte går att nå, även i utveckling', async () => {
    // Till skillnad från skapaKund m.fl. finns inget meningsfullt demoläge
    // för radering - att låtsas att en kund togs bort vore vilseledande.
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const { taBortKund, hamtaDatabas } = await laddaStore()
    const kundId = hamtaDatabas().kunder[0].id
    const antalInnan = hamtaDatabas().kunder.length

    await expect(taBortKund(kundId)).rejects.toThrow('Kunden kunde inte tas bort just nu.')

    expect(hamtaDatabas().kunder.length).toBe(antalInnan)
    expect(hamtaDatabas().kunder.some((k) => k.id === kundId)).toBe(true)
  })

  it('taBortArenden kastar och rör INTE den lokala cachen om API:t inte går att nå, även i utveckling', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const { taBortArenden, hamtaDatabas } = await laddaStore()
    const arendeId = hamtaDatabas().arenden[0].id
    const antalInnan = hamtaDatabas().arenden.length

    await expect(taBortArenden([arendeId])).rejects.toThrow('Ärendena kunde inte tas bort just nu.')

    expect(hamtaDatabas().arenden.length).toBe(antalInnan)
    expect(hamtaDatabas().arenden.some((a) => a.id === arendeId)).toBe(true)
  })

  it('taBortKund tar faktiskt bort kunden ur cachen vid ett lyckat serversvar', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { taBortKund, hamtaDatabas } = await laddaStore()
    const kundId = hamtaDatabas().kunder[0].id
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(svaraMed({ ok: true, id: kundId })))

    await taBortKund(kundId)

    expect(hamtaDatabas().kunder.some((k) => k.id === kundId)).toBe(false)
  })
})
