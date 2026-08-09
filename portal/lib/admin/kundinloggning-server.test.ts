import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

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

const forsokSkickaNyaInloggningsuppgifterMock = vi.fn()
vi.mock('@/lib/admin/kundportal-konto-client', () => ({
  forsokSkickaNyaInloggningsuppgifter: (...args: unknown[]) =>
    forsokSkickaNyaInloggningsuppgifterMock(...args),
}))

const forsokSkickaValkomstmejlMock = vi.fn().mockResolvedValue(undefined)
vi.mock('@/lib/admin/kundportal-valkomst-server', () => ({
  forsokSkickaValkomstmejl: (...args: unknown[]) => forsokSkickaValkomstmejlMock(...args),
}))

let skickaNyaInloggningsuppgifterForArende: typeof import('@/lib/admin/kundinloggning-server').skickaNyaInloggningsuppgifterForArende

beforeAll(async () => {
  ;({ skickaNyaInloggningsuppgifterForArende } = await import('@/lib/admin/kundinloggning-server'))
})

const arendeRad = {
  id: 'arende-1',
  arendenummer: 'NIT-2501',
  kund_id: 'kund-1',
  kund_namn: 'Birgitta Sandell',
  epost: 'birgitta@exempel.se',
}

beforeEach(() => {
  vi.clearAllMocks()
  arendeSingle.mockResolvedValue({ data: arendeRad, error: null })
  aktivitetInsert.mockResolvedValue({ error: null })
  forsokSkickaValkomstmejlMock.mockResolvedValue(undefined)
})

describe('skickaNyaInloggningsuppgifterForArende', () => {
  it('kastar 404 om ärendet inte hittas', async () => {
    arendeSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })

    await expect(
      skickaNyaInloggningsuppgifterForArende('arende-saknas', 'Admin'),
    ).rejects.toMatchObject({ status: 404 })
    expect(forsokSkickaNyaInloggningsuppgifterMock).not.toHaveBeenCalled()
  })

  it('kastar om kunden saknar e-postadress', async () => {
    arendeSingle.mockResolvedValue({ data: { ...arendeRad, epost: '' }, error: null })

    await expect(
      skickaNyaInloggningsuppgifterForArende('arende-1', 'Admin'),
    ).rejects.toMatchObject({ status: 422 })
  })

  it('kastar 502 om kundportalen inte kan nås', async () => {
    forsokSkickaNyaInloggningsuppgifterMock.mockResolvedValue(undefined)

    await expect(
      skickaNyaInloggningsuppgifterForArende('arende-1', 'Admin'),
    ).rejects.toMatchObject({ status: 502 })
    expect(forsokSkickaValkomstmejlMock).not.toHaveBeenCalled()
  })

  it('skickar mejl med ärendenummer och loggar aktivitet vid NYTT konto', async () => {
    forsokSkickaNyaInloggningsuppgifterMock.mockResolvedValue({
      kontoSkapat: true,
      kontoAterstallt: false,
      tillfalligtLosenord: 'ett-tillfalligt-losenord',
    })

    const resultat = await skickaNyaInloggningsuppgifterForArende('arende-1', 'Admin Nova')

    expect(resultat).toEqual({ kontoSkapat: true, kontoAterstallt: false })
    expect(forsokSkickaNyaInloggningsuppgifterMock).toHaveBeenCalledWith(
      'kund-1',
      'birgitta@exempel.se',
    )
    expect(forsokSkickaValkomstmejlMock).toHaveBeenCalledWith({
      epost: 'birgitta@exempel.se',
      kundNamn: 'Birgitta Sandell',
      tillfalligtLosenord: 'ett-tillfalligt-losenord',
      arendenummer: 'NIT-2501',
      atersallt: false,
    })
    expect(aktivitetInsert).toHaveBeenCalledWith(
      expect.objectContaining({ arende_id: 'arende-1', typ: 'kundinloggning', aktor: 'Admin Nova' }),
    )
  })

  it('markerar aktiviteten som återställning vid befintligt konto', async () => {
    forsokSkickaNyaInloggningsuppgifterMock.mockResolvedValue({
      kontoSkapat: false,
      kontoAterstallt: true,
      tillfalligtLosenord: 'ett-nytt-losenord',
    })

    const resultat = await skickaNyaInloggningsuppgifterForArende('arende-1', 'Admin Nova')

    expect(resultat).toEqual({ kontoSkapat: false, kontoAterstallt: true })
    expect(forsokSkickaValkomstmejlMock).toHaveBeenCalledWith(
      expect.objectContaining({ atersallt: true }),
    )
    expect(aktivitetInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        beskrivning: expect.stringContaining('Nya inloggningsuppgifter'),
      }),
    )
  })
})
