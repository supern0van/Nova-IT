import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET, PATCH, POST } from './route'
import { harAdminAtkomst } from '@/lib/auth/profiler-server'
import {
  hamtaOperativAdminData,
  OperativtAdminFel,
  avbokaOperativBokning,
  laggTillOperativKundanteckning,
  laggTillOperativtMeddelande,
  skapaOperativBokning,
  skapaOperativKund,
  skapaOperativtArende,
  taBortOperativKundanteckning,
  uppdateraOperativBokning,
  uppdateraOperativKund,
  uppdateraOperativKundanteckning,
  uppdateraOperativtArende,
} from '@/lib/admin/operativa-server'
import { hamtaAutentiseradAnvandarId } from '@/lib/supabase/route-anvandare'

vi.mock('@/lib/supabase/route-anvandare', () => ({ hamtaAutentiseradAnvandarId: vi.fn() }))
vi.mock('@/lib/auth/profiler-server', () => ({ harAdminAtkomst: vi.fn() }))
vi.mock('@/lib/admin/operativa-server', () => ({
  OperativtAdminFel: class OperativtAdminFel extends Error {
    status: number
    constructor(message: string, status = 400) {
      super(message)
      this.status = status
    }
  },
  hamtaOperativAdminData: vi.fn(),
  avbokaOperativBokning: vi.fn(),
  laggTillOperativKundanteckning: vi.fn(),
  laggTillOperativtMeddelande: vi.fn(),
  skapaOperativBokning: vi.fn(),
  skapaOperativKund: vi.fn(),
  skapaOperativtArende: vi.fn(),
  taBortOperativKundanteckning: vi.fn(),
  uppdateraOperativBokning: vi.fn(),
  uppdateraOperativKund: vi.fn(),
  uppdateraOperativKundanteckning: vi.fn(),
  uppdateraOperativtArende: vi.fn(),
}))

const hamtaAutentiseradAnvandarIdMock = vi.mocked(hamtaAutentiseradAnvandarId)
const harAdminAtkomstMock = vi.mocked(harAdminAtkomst)
const hamtaOperativAdminDataMock = vi.mocked(hamtaOperativAdminData)
const avbokaOperativBokningMock = vi.mocked(avbokaOperativBokning)
const laggTillOperativKundanteckningMock = vi.mocked(laggTillOperativKundanteckning)
const laggTillOperativtMeddelandeMock = vi.mocked(laggTillOperativtMeddelande)
const skapaOperativBokningMock = vi.mocked(skapaOperativBokning)
const skapaOperativKundMock = vi.mocked(skapaOperativKund)
const skapaOperativtArendeMock = vi.mocked(skapaOperativtArende)
const taBortOperativKundanteckningMock = vi.mocked(taBortOperativKundanteckning)
const uppdateraOperativBokningMock = vi.mocked(uppdateraOperativBokning)
const uppdateraOperativKundMock = vi.mocked(uppdateraOperativKund)
const uppdateraOperativKundanteckningMock = vi.mocked(uppdateraOperativKundanteckning)
const uppdateraOperativtArendeMock = vi.mocked(uppdateraOperativtArende)

function request() {
  return new NextRequest('https://admin.nova-it.se/api/admin/operativt')
}

function postRequest(body: unknown) {
  return new NextRequest('https://admin.nova-it.se/api/admin/operativt', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

function patchRequest(body: unknown) {
  return new NextRequest('https://admin.nova-it.se/api/admin/operativt', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

const tomtOperativtSvar = {
  kunder: [],
  arenden: [],
  bokningar: [],
  meddelanden: [],
  aktiviteter: [],
  kundanteckningar: [],
}

describe('/api/admin/operativt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returnerar 401 utan AAL2-session', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue(null)

    const svar = await GET(request())

    expect(svar.status).toBe(401)
    expect(await svar.json()).toEqual(tomtOperativtSvar)
    expect(harAdminAtkomstMock).not.toHaveBeenCalled()
  })

  it('returnerar 403 för icke-admin', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    harAdminAtkomstMock.mockResolvedValue(false)

    const svar = await GET(request())

    expect(svar.status).toBe(403)
    expect(await svar.json()).toEqual(tomtOperativtSvar)
    expect(hamtaOperativAdminDataMock).not.toHaveBeenCalled()
  })

  it('returnerar operativ data för admin', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    harAdminAtkomstMock.mockResolvedValue(true)
    hamtaOperativAdminDataMock.mockResolvedValue({
      ...tomtOperativtSvar,
    })

    const svar = await GET(request())

    expect(svar.status).toBe(200)
    expect(await svar.json()).toEqual(tomtOperativtSvar)
  })

  it('fail-closed om adminrollen inte kan läsas', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    harAdminAtkomstMock.mockRejectedValue(new Error('roll nere'))

    const svar = await GET(request())

    expect(svar.status).toBe(500)
    expect(await svar.json()).toEqual(tomtOperativtSvar)
  })

  it('fail-closed om operativa tabeller inte kan läsas', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    harAdminAtkomstMock.mockResolvedValue(true)
    hamtaOperativAdminDataMock.mockRejectedValue(new Error('tabell saknas'))

    const svar = await GET(request())

    expect(svar.status).toBe(500)
    expect(await svar.json()).toEqual(tomtOperativtSvar)
  })

  it('returnerar 401 vid POST utan AAL2-session', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue(null)

    const svar = await POST(postRequest({ typ: 'skapa_kund', data: {} }))

    expect(svar.status).toBe(401)
    expect(await svar.json()).toEqual({ ok: false })
    expect(skapaOperativKundMock).not.toHaveBeenCalled()
  })

  it('returnerar 400 vid okänd POST-typ', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    harAdminAtkomstMock.mockResolvedValue(true)

    const svar = await POST(postRequest({ typ: 'ta_bort_allt', data: {} }))

    expect(svar.status).toBe(400)
    expect(await svar.json()).toEqual({ ok: false })
  })

  it('returnerar 400 vid kontrollerat valideringsfel', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    harAdminAtkomstMock.mockResolvedValue(true)
    skapaOperativKundMock.mockRejectedValue(new OperativtAdminFel('ogiltigt', 400))

    const svar = await POST(postRequest({ typ: 'skapa_kund', data: { namn: 'A' } }))

    expect(svar.status).toBe(400)
    expect(await svar.json()).toEqual({ ok: false })
  })

  it('skapar kund för admin', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    harAdminAtkomstMock.mockResolvedValue(true)
    skapaOperativKundMock.mockResolvedValue({
      id: 'kund-1',
      namn: 'Nova Test',
      kundtyp: 'privatperson',
      epost: 'test@example.com',
      telefon: '0700000000',
      adress: '',
      ort: '',
      senasteKontakt: '2026-07-28T00:00:00.000Z',
      skapad: '2026-07-28T00:00:00.000Z',
    })

    const data = { namn: 'Nova Test' }
    const svar = await POST(postRequest({ typ: 'skapa_kund', data }))

    expect(svar.status).toBe(201)
    expect(await svar.json()).toEqual({
      ok: true,
      kund: {
        id: 'kund-1',
        namn: 'Nova Test',
        kundtyp: 'privatperson',
        epost: 'test@example.com',
        telefon: '0700000000',
        adress: '',
        ort: '',
        senasteKontakt: '2026-07-28T00:00:00.000Z',
        skapad: '2026-07-28T00:00:00.000Z',
      },
    })
    expect(skapaOperativKundMock).toHaveBeenCalledWith(data)
  })

  it('skapar ärende och bokning för admin', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    harAdminAtkomstMock.mockResolvedValue(true)
    skapaOperativtArendeMock.mockResolvedValue({
      id: 'arende-1',
      arendenummer: 'NIT-2401',
      rubrik: 'Test',
      kundId: 'kund-1',
      kundNamn: 'Nova Test',
      kundtyp: 'privatperson',
      epost: 'test@example.com',
      telefon: '0700000000',
      kategori: 'installation',
      underkategori: '',
      status: 'ny',
      prioritet: 'normal',
      ansvarigId: null,
      kanal: 'telefon',
      beskrivning: 'Testbeskrivning',
      bilagor: [],
      skapad: '2026-07-28T00:00:00.000Z',
      uppdaterad: '2026-07-28T00:00:00.000Z',
    })
    skapaOperativBokningMock.mockResolvedValue({
      id: 'bokning-1',
      kundId: 'kund-1',
      kundNamn: 'Nova Test',
      typ: 'hembesok',
      status: 'planerad',
      datum: '2026-07-29',
      tid: '09:00',
      langdMinuter: 60,
      tekniker: 'user-1',
      plats: 'Adress',
    })

    await expect(
      (await POST(postRequest({ typ: 'skapa_arende', data: { rubrik: 'Test' } }))).json(),
    ).resolves.toMatchObject({ ok: true, arende: { id: 'arende-1' } })
    await expect(
      (await POST(postRequest({ typ: 'skapa_bokning', data: { kundId: 'kund-1' } }))).json(),
    ).resolves.toMatchObject({ ok: true, bokning: { id: 'bokning-1' } })
  })

  it('skapar meddelande och kundanteckning för admin', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    harAdminAtkomstMock.mockResolvedValue(true)
    laggTillOperativtMeddelandeMock.mockResolvedValue({
      id: 'meddelande-1',
      arendeId: 'arende-1',
      avsandare: 'personal',
      avsandareNamn: 'Admin',
      text: 'Svar',
      tidpunkt: '2026-07-28T00:00:00.000Z',
      internt: false,
    })
    laggTillOperativKundanteckningMock.mockResolvedValue({
      id: 'anteckning-1',
      kundId: 'kund-1',
      text: 'Intern notering',
      forfattare: 'Admin',
      skapad: '2026-07-28T00:00:00.000Z',
    })

    await expect(
      (await POST(postRequest({ typ: 'lagg_till_meddelande', data: { arendeId: 'arende-1', text: 'Svar' } }))).json(),
    ).resolves.toMatchObject({ ok: true, meddelande: { id: 'meddelande-1' } })
    await expect(
      (await POST(postRequest({ typ: 'lagg_till_kundanteckning', data: { kundId: 'kund-1', text: 'Intern notering' } }))).json(),
    ).resolves.toMatchObject({ ok: true, anteckning: { id: 'anteckning-1' } })
  })

  it('returnerar 401 vid PATCH utan AAL2-session', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue(null)

    const svar = await PATCH(patchRequest({ typ: 'uppdatera_kund', data: { id: 'kund-1' } }))

    expect(svar.status).toBe(401)
    expect(await svar.json()).toEqual({ ok: false })
    expect(uppdateraOperativKundMock).not.toHaveBeenCalled()
  })

  it('returnerar 400 vid okänd PATCH-typ', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    harAdminAtkomstMock.mockResolvedValue(true)

    const svar = await PATCH(patchRequest({ typ: 'massuppdatera', data: {} }))

    expect(svar.status).toBe(400)
    expect(await svar.json()).toEqual({ ok: false })
  })

  it('uppdaterar kund, bokning och ärende för admin', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    harAdminAtkomstMock.mockResolvedValue(true)
    uppdateraOperativKundMock.mockResolvedValue({
      id: 'kund-1',
      namn: 'Nova Test',
      kundtyp: 'privatperson',
      epost: 'ny@example.com',
      telefon: '0700000000',
      adress: '',
      ort: '',
      senasteKontakt: '2026-07-28T00:00:00.000Z',
      skapad: '2026-07-28T00:00:00.000Z',
    })
    uppdateraOperativBokningMock.mockResolvedValue({
      id: 'bokning-1',
      kundId: 'kund-1',
      kundNamn: 'Nova Test',
      typ: 'hembesok',
      status: 'bekraftad',
      datum: '2026-07-29',
      tid: '09:00',
      langdMinuter: 60,
      tekniker: 'user-1',
      plats: 'Adress',
    })
    uppdateraOperativtArendeMock.mockResolvedValue({
      id: 'arende-1',
      arendenummer: 'NIT-2401',
      rubrik: 'Test',
      kundId: 'kund-1',
      kundNamn: 'Nova Test',
      kundtyp: 'privatperson',
      epost: 'test@example.com',
      telefon: '0700000000',
      kategori: 'installation',
      underkategori: '',
      status: 'pagaende',
      prioritet: 'normal',
      ansvarigId: null,
      kanal: 'telefon',
      beskrivning: 'Testbeskrivning',
      bilagor: [],
      skapad: '2026-07-28T00:00:00.000Z',
      uppdaterad: '2026-07-28T00:00:00.000Z',
    })

    await expect(
      (await PATCH(patchRequest({ typ: 'uppdatera_kund', data: { id: 'kund-1', andringar: { epost: 'ny@example.com' } } }))).json(),
    ).resolves.toMatchObject({ ok: true, kund: { id: 'kund-1' } })
    await expect(
      (await PATCH(patchRequest({ typ: 'uppdatera_bokning', data: { id: 'bokning-1', andringar: { status: 'bekraftad' }, aktor: 'Admin' } }))).json(),
    ).resolves.toMatchObject({ ok: true, bokning: { id: 'bokning-1' } })
    await expect(
      (await PATCH(patchRequest({ typ: 'uppdatera_arende', data: { id: 'arende-1', andringar: { status: 'pagaende' }, aktivitet: { typ: 'status', beskrivning: 'Status ändrades', aktor: 'Admin' } } }))).json(),
    ).resolves.toMatchObject({ ok: true, arende: { id: 'arende-1' } })
  })

  it('avbokar bokning för admin', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    harAdminAtkomstMock.mockResolvedValue(true)
    avbokaOperativBokningMock.mockResolvedValue({
      id: 'bokning-1',
      kundId: 'kund-1',
      kundNamn: 'Nova Test',
      typ: 'hembesok',
      status: 'avbokad',
      datum: '2026-07-29',
      tid: '09:00',
      langdMinuter: 60,
      tekniker: 'user-1',
      plats: 'Adress',
    })

    const svar = await PATCH(patchRequest({ typ: 'avboka_bokning', data: { id: 'bokning-1', aktor: 'Admin' } }))

    expect(svar.status).toBe(200)
    expect(await svar.json()).toMatchObject({ ok: true, bokning: { status: 'avbokad' } })
  })

  it('uppdaterar och tar bort kundanteckning för admin', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    harAdminAtkomstMock.mockResolvedValue(true)
    uppdateraOperativKundanteckningMock.mockResolvedValue({
      id: 'anteckning-1',
      kundId: 'kund-1',
      text: 'Uppdaterad',
      forfattare: 'Admin',
      skapad: '2026-07-28T00:00:00.000Z',
      uppdaterad: '2026-07-28T01:00:00.000Z',
    })
    taBortOperativKundanteckningMock.mockResolvedValue('anteckning-1')

    await expect(
      (await PATCH(patchRequest({ typ: 'uppdatera_kundanteckning', data: { id: 'anteckning-1', text: 'Uppdaterad' } }))).json(),
    ).resolves.toMatchObject({ ok: true, anteckning: { id: 'anteckning-1' } })
    await expect(
      (await PATCH(patchRequest({ typ: 'ta_bort_kundanteckning', data: { id: 'anteckning-1' } }))).json(),
    ).resolves.toEqual({ ok: true, id: 'anteckning-1' })
  })
})
