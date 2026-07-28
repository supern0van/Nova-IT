// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * Läsvägens motsvarighet till store.test.ts: i produktion ska ett trasigt
 * operativt API ge tomma listor + fel-flagga, aldrig demo-/localStorage-data
 * som ser ut som riktig kunddata.
 */

async function laddaHook() {
  vi.resetModules()
  return import('@/hooks/use-operativ-admin-data')
}

const tomtSvar = {
  kunder: [],
  arenden: [],
  bokningar: [],
  meddelanden: [],
  aktiviteter: [],
  kundanteckningar: [],
  personal: [],
}

function svaraMed(kropp: unknown, ok = true) {
  return { ok, status: ok ? 200 : 500, json: async () => kropp } as Response
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  cleanup()
})

describe('useOperativAdminData', () => {
  it('visar aldrig demo-/localStorage-kunder i produktion när API:t failar', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const { useOperativAdminData } = await laddaHook()

    const { result } = renderHook(() => useOperativAdminData())

    await waitFor(() => expect(result.current.laddar).toBe(false))
    expect(result.current.fel).toBe(true)
    expect(result.current.db?.kunder).toEqual([])
    expect(result.current.db?.arenden).toEqual([])
    expect(result.current.db?.bokningar).toEqual([])
  })

  it('markerar fel även när servern nekar anropet', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(svaraMed({}, false)))
    const { useOperativAdminData } = await laddaHook()

    const { result } = renderHook(() => useOperativAdminData())

    await waitFor(() => expect(result.current.laddar).toBe(false))
    expect(result.current.fel).toBe(true)
    expect(result.current.db?.kunder).toEqual([])
  })

  it('markerar fel när svaret har oväntat format', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(svaraMed({ kunder: 'inte-en-lista' })))
    const { useOperativAdminData } = await laddaHook()

    const { result } = renderHook(() => useOperativAdminData())

    await waitFor(() => expect(result.current.laddar).toBe(false))
    expect(result.current.fel).toBe(true)
    expect(result.current.db?.kunder).toEqual([])
  })

  it('använder serverns data och rensar fel-flaggan vid lyckad läsning', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const serverKund = {
      id: 'kund-fran-servern',
      namn: 'Servern Kundsson',
      kundtyp: 'privatperson',
      epost: 'a@b.se',
      telefon: '070',
      adress: 'Gatan 1',
      ort: 'Stockholm',
      senasteKontakt: '2026-07-28T00:00:00.000Z',
      skapad: '2026-07-28T00:00:00.000Z',
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(svaraMed({ ...tomtSvar, kunder: [serverKund] })),
    )
    const { useOperativAdminData } = await laddaHook()

    const { result } = renderHook(() => useOperativAdminData())

    await waitFor(() => expect(result.current.laddar).toBe(false))
    expect(result.current.fel).toBe(false)
    expect(result.current.db?.kunder).toHaveLength(1)
    expect(result.current.db?.kunder[0].id).toBe('kund-fran-servern')
  })

  it('läser om data när en skrivning signalerar nova-it:data-uppdaterad', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const fetchMock = vi.fn().mockResolvedValue(svaraMed(tomtSvar))
    vi.stubGlobal('fetch', fetchMock)
    const { useOperativAdminData } = await laddaHook()

    const { result } = renderHook(() => useOperativAdminData())
    await waitFor(() => expect(result.current.laddar).toBe(false))
    const anropInnan = fetchMock.mock.calls.length

    await act(async () => {
      window.dispatchEvent(new CustomEvent('nova-it:data-uppdaterad'))
    })

    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(anropInnan))
  })

  it('hämtar om data när uppdatera() anropas, t.ex. från felbannerns Försök igen', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)
    const { useOperativAdminData } = await laddaHook()

    const { result } = renderHook(() => useOperativAdminData())
    await waitFor(() => expect(result.current.fel).toBe(true))

    fetchMock.mockResolvedValue(svaraMed(tomtSvar))
    await act(async () => {
      await result.current.uppdatera()
    })

    expect(result.current.fel).toBe(false)
  })
})
