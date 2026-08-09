import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET, PATCH, POST } from './route'
import { hamtaEgenProfilFranDatabasen, hamtaRollFranDatabasen } from '@/lib/auth/roll-server'
import {
  hamtaOperativAdminData,
  OperativtAdminFel,
  avbokaOperativBokning,
  laggTillOperativKundanteckning,
  laggTillOperativtMeddelande,
  skapaOperativBokning,
  skapaOperativKund,
  skapaOperativtArende,
  taBortOperativArenden,
  taBortOperativKund,
  taBortOperativKundanteckning,
  uppdateraOperativBokning,
  uppdateraOperativKund,
  uppdateraOperativKundanteckning,
  uppdateraOperativtArende,
} from '@/lib/admin/operativa-server'
import { skickaNyaInloggningsuppgifterForArende } from '@/lib/admin/kundinloggning-server'
import { forsokHamtaKundkontoStatus } from '@/lib/admin/kundportal-konto-client'
import { skickaKlarForUpphamtningSms } from '@/lib/admin/sms-server'
import { hamtaAutentiseradAnvandarId } from '@/lib/supabase/route-anvandare'

const { hamtaAutentiseradAnvandare } = vi.hoisted(() => ({
  hamtaAutentiseradAnvandare: vi.fn(),
}))
vi.mock('@/lib/supabase/route-anvandare', () => ({
  hamtaAutentiseradAnvandarId: vi.fn(),
  hamtaAutentiseradAnvandare,
}))
vi.mock('@/lib/auth/roll-server', () => ({
  hamtaEgenProfilFranDatabasen: vi.fn(),
  hamtaRollFranDatabasen: vi.fn(),
}))
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
  taBortOperativArenden: vi.fn(),
  taBortOperativKund: vi.fn(),
  taBortOperativKundanteckning: vi.fn(),
  uppdateraOperativBokning: vi.fn(),
  uppdateraOperativKund: vi.fn(),
  uppdateraOperativKundanteckning: vi.fn(),
  uppdateraOperativtArende: vi.fn(),
}))
vi.mock('@/lib/admin/sms-server', () => ({
  skickaKlarForUpphamtningSms: vi.fn(),
}))
vi.mock('@/lib/admin/kundinloggning-server', () => ({
  skickaNyaInloggningsuppgifterForArende: vi.fn(),
}))
vi.mock('@/lib/admin/kundportal-konto-client', () => ({
  forsokHamtaKundkontoStatus: vi.fn(),
}))

const hamtaAutentiseradAnvandarIdMock = vi.mocked(hamtaAutentiseradAnvandarId)
const hamtaEgenProfilFranDatabasenMock = vi.mocked(hamtaEgenProfilFranDatabasen)
const hamtaRollFranDatabasenMock = vi.mocked(hamtaRollFranDatabasen)
const hamtaOperativAdminDataMock = vi.mocked(hamtaOperativAdminData)
const avbokaOperativBokningMock = vi.mocked(avbokaOperativBokning)
const laggTillOperativKundanteckningMock = vi.mocked(laggTillOperativKundanteckning)
const laggTillOperativtMeddelandeMock = vi.mocked(laggTillOperativtMeddelande)
const skapaOperativBokningMock = vi.mocked(skapaOperativBokning)
const skapaOperativKundMock = vi.mocked(skapaOperativKund)
const skapaOperativtArendeMock = vi.mocked(skapaOperativtArende)
const taBortOperativArendenMock = vi.mocked(taBortOperativArenden)
const taBortOperativKundMock = vi.mocked(taBortOperativKund)
const taBortOperativKundanteckningMock = vi.mocked(taBortOperativKundanteckning)
const uppdateraOperativBokningMock = vi.mocked(uppdateraOperativBokning)
const uppdateraOperativKundMock = vi.mocked(uppdateraOperativKund)
const uppdateraOperativKundanteckningMock = vi.mocked(uppdateraOperativKundanteckning)
const uppdateraOperativtArendeMock = vi.mocked(uppdateraOperativtArende)
const skickaKlarForUpphamtningSmsMock = vi.mocked(skickaKlarForUpphamtningSms)
const skickaNyaInloggningsuppgifterForArendeMock = vi.mocked(skickaNyaInloggningsuppgifterForArende)
const forsokHamtaKundkontoStatusMock = vi.mocked(forsokHamtaKundkontoStatus)

function request() {
  return new NextRequest('https://admin.nova-it.se/api/admin/operativt')
}

function statusRequest(adminKundId: string) {
  return new NextRequest(
    `https://admin.nova-it.se/api/admin/operativt?kundportalStatus=${encodeURIComponent(adminKundId)}`,
  )
}

function postRequest(body: unknown) {
  return new NextRequest('https://admin.nova-it.se/api/admin/operativt', {
    method: 'POST',
    headers: {
      origin: 'https://admin.nova-it.se',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

function patchRequest(body: unknown) {
  return new NextRequest('https://admin.nova-it.se/api/admin/operativt', {
    method: 'PATCH',
    headers: {
      origin: 'https://admin.nova-it.se',
      'content-type': 'application/json',
    },
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
  personal: [],
}

const kundStomme = {
  id: 'kund-1',
  namn: 'Nova Test',
  kundtyp: 'privatperson' as const,
  epost: 'test@example.com',
  telefon: '0700000000',
  adress: '',
  ort: '',
  senasteKontakt: '2026-07-28T00:00:00.000Z',
  skapad: '2026-07-28T00:00:00.000Z',
}

describe('/api/admin/operativt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hamtaEgenProfilFranDatabasenMock.mockResolvedValue({
      epost: 'test@example.com',
      namn: 'Verifierad Admin',
    })
    hamtaAutentiseradAnvandare.mockImplementation(async (request: NextRequest) => {
      const id = await hamtaAutentiseradAnvandarIdMock(request)
      return id ? { id, epost: 'test@example.com', demogast: false } : null
    })
  })

  it('returnerar 401 utan AAL2-session', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue(null)

    const svar = await GET(request())

    expect(svar.status).toBe(401)
    expect(await svar.json()).toEqual(tomtOperativtSvar)
    expect(hamtaRollFranDatabasenMock).not.toHaveBeenCalled()
  })

  it('släpper igenom en medarbetare (tekniker) för läsning – inte längre admin-only', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('medarbetare')
    hamtaOperativAdminDataMock.mockResolvedValue({ ...tomtOperativtSvar })

    const svar = await GET(request())

    expect(svar.status).toBe(200)
    expect(await svar.json()).toEqual(tomtOperativtSvar)
  })

  it('returnerar kundportalstatus via kundportalStatus-parametern, utan att hämta operativ data', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('medarbetare')
    forsokHamtaKundkontoStatusMock.mockResolvedValue({
      kontoFinns: true,
      masteBytaLosenord: false,
      senastInloggad: '2026-08-01T10:00:00.000Z',
    })

    const svar = await GET(statusRequest('kund-1'))

    expect(svar.status).toBe(200)
    expect(await svar.json()).toEqual({
      ok: true,
      kontoFinns: true,
      masteBytaLosenord: false,
      senastInloggad: '2026-08-01T10:00:00.000Z',
    })
    expect(forsokHamtaKundkontoStatusMock).toHaveBeenCalledWith('kund-1')
    expect(hamtaOperativAdminDataMock).not.toHaveBeenCalled()
  })

  it('returnerar 502 för kundportalStatus om kundportalen inte kan nås', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('medarbetare')
    forsokHamtaKundkontoStatusMock.mockResolvedValue(undefined)

    const svar = await GET(statusRequest('kund-1'))

    expect(svar.status).toBe(502)
  })

  it('kräver fortfarande giltig session för kundportalStatus', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue(null)

    const svar = await GET(statusRequest('kund-1'))

    expect(svar.status).toBe(401)
    expect(forsokHamtaKundkontoStatusMock).not.toHaveBeenCalled()
  })

  it('returnerar operativ data för administrator', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')
    hamtaOperativAdminDataMock.mockResolvedValue({ ...tomtOperativtSvar })

    const svar = await GET(request())

    expect(svar.status).toBe(200)
    expect(await svar.json()).toEqual(tomtOperativtSvar)
  })

  it('fail-closed om systemrollen inte kan läsas', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockRejectedValue(new Error('roll nere'))

    const svar = await GET(request())

    expect(svar.status).toBe(500)
    expect(await svar.json()).toEqual(tomtOperativtSvar)
  })

  it('fail-closed om profilen saknar systemroll (null)', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue(null)

    const svar = await GET(request())

    expect(svar.status).toBe(500)
    expect(await svar.json()).toEqual(tomtOperativtSvar)
  })

  it('fail-closed om den verifierade serverprofilen saknas', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')
    hamtaEgenProfilFranDatabasenMock.mockResolvedValue(null)

    const svar = await GET(request())

    expect(svar.status).toBe(500)
    expect(await svar.json()).toEqual(tomtOperativtSvar)
    expect(hamtaOperativAdminDataMock).not.toHaveBeenCalled()
  })

  it('fail-closed om operativa tabeller inte kan läsas', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')
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

  it('nekar POST från annat origin innan sessionen används', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')

    const svar = await POST(
      new NextRequest('https://admin.nova-it.se/api/admin/operativt', {
        method: 'POST',
        headers: {
          origin: 'https://angripare.example',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ typ: 'skapa_kund', data: {} }),
      }),
    )

    expect(svar.status).toBe(403)
    expect(hamtaAutentiseradAnvandarIdMock).not.toHaveBeenCalled()
  })

  it('kräver JSON för POST innan sessionen används', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')

    const svar = await POST(
      new NextRequest('https://admin.nova-it.se/api/admin/operativt', {
        method: 'POST',
        headers: {
          origin: 'https://admin.nova-it.se',
          'content-type': 'text/plain',
        },
        body: 'typ=skapa_kund',
      }),
    )

    expect(svar.status).toBe(415)
    expect(hamtaAutentiseradAnvandarIdMock).not.toHaveBeenCalled()
  })

  it('returnerar 400 vid okänd POST-typ', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')

    const svar = await POST(postRequest({ typ: 'ta_bort_allt', data: {} }))

    expect(svar.status).toBe(400)
    expect(await svar.json()).toEqual({ ok: false })
  })

  it('returnerar 400 vid trasig (icke-JSON) POST-body i stället för att krascha', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')

    const trasigRequest = new NextRequest('https://admin.nova-it.se/api/admin/operativt', {
      method: 'POST',
      headers: {
        origin: 'https://admin.nova-it.se',
        'content-type': 'application/json',
      },
      body: '{ inte giltig json',
    })
    const svar = await POST(trasigRequest)

    expect(svar.status).toBe(400)
    expect(await svar.json()).toEqual({ ok: false })
    expect(skapaOperativKundMock).not.toHaveBeenCalled()
  })

  it('returnerar 400 om payload saknar typ/data-formen (t.ex. en JSON-array eller sträng)', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')

    const svar = await POST(postRequest(['inte', 'ett', 'objekt']))

    expect(svar.status).toBe(400)
    expect(await svar.json()).toEqual({ ok: false })
  })

  it('returnerar 400 vid kontrollerat valideringsfel', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')
    skapaOperativKundMock.mockRejectedValue(new OperativtAdminFel('ogiltigt', 400))

    const svar = await POST(postRequest({ typ: 'skapa_kund', data: { namn: 'A' } }))

    expect(svar.status).toBe(400)
    expect(await svar.json()).toEqual({ ok: false })
  })

  it('nekar skapa_kund för medarbetare (saknar redigera_kund)', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('medarbetare')

    const svar = await POST(postRequest({ typ: 'skapa_kund', data: { namn: 'Nova Test' } }))

    expect(svar.status).toBe(403)
    expect(await svar.json()).toEqual({ ok: false })
    expect(skapaOperativKundMock).not.toHaveBeenCalled()
  })

  it('nekar lagg_till_kundanteckning för medarbetare (saknar redigera_kund)', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('medarbetare')

    const svar = await POST(
      postRequest({ typ: 'lagg_till_kundanteckning', data: { kundId: 'kund-1', text: 'Notering' } }),
    )

    expect(svar.status).toBe(403)
    expect(laggTillOperativKundanteckningMock).not.toHaveBeenCalled()
  })

  it('tillåter skapa_arende, skapa_bokning och lagg_till_meddelande för medarbetare', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('medarbetare')
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

    const svar = await POST(postRequest({ typ: 'skapa_arende', data: { rubrik: 'Test' } }))

    expect(svar.status).toBe(201)
    expect(skapaOperativtArendeMock).toHaveBeenCalled()
  })

  it('skapar kund för admin', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')
    skapaOperativKundMock.mockResolvedValue(kundStomme)

    const data = { namn: 'Nova Test', forfattare: 'Förfalskat namn' }
    const svar = await POST(postRequest({ typ: 'skapa_kund', data }))

    expect(svar.status).toBe(201)
    expect(await svar.json()).toEqual({ ok: true, kund: kundStomme })
    expect(skapaOperativKundMock).toHaveBeenCalledWith({
      ...data,
      forfattare: 'Verifierad Admin',
    })
  })

  it('skapar ärende och bokning för admin', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')
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
      (await POST(postRequest({ typ: 'skapa_arende', data: { rubrik: 'Test', aktor: 'Förfalskat namn' } }))).json(),
    ).resolves.toMatchObject({ ok: true, arende: { id: 'arende-1' } })
    await expect(
      (await POST(postRequest({ typ: 'skapa_bokning', data: { kundId: 'kund-1', aktor: 'Förfalskat namn' } }))).json(),
    ).resolves.toMatchObject({ ok: true, bokning: { id: 'bokning-1' } })
    expect(skapaOperativtArendeMock).toHaveBeenCalledWith(
      expect.objectContaining({ aktor: 'Verifierad Admin' }),
    )
    expect(skapaOperativBokningMock).toHaveBeenCalledWith(
      expect.objectContaining({ aktor: 'Verifierad Admin' }),
    )
  })

  it('skapar meddelande och kundanteckning för admin', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')
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
      (await POST(postRequest({ typ: 'lagg_till_meddelande', data: { arendeId: 'arende-1', text: 'Svar', avsandareNamn: 'Förfalskat namn' } }))).json(),
    ).resolves.toMatchObject({ ok: true, meddelande: { id: 'meddelande-1' } })
    await expect(
      (await POST(postRequest({ typ: 'lagg_till_kundanteckning', data: { kundId: 'kund-1', text: 'Intern notering', forfattare: 'Förfalskat namn' } }))).json(),
    ).resolves.toMatchObject({ ok: true, anteckning: { id: 'anteckning-1' } })
    expect(laggTillOperativtMeddelandeMock).toHaveBeenCalledWith(
      expect.objectContaining({ avsandareNamn: 'Verifierad Admin' }),
    )
    expect(laggTillOperativKundanteckningMock).toHaveBeenCalledWith(
      expect.objectContaining({ forfattare: 'Verifierad Admin' }),
    )
  })

  it('returnerar 401 vid PATCH utan AAL2-session', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue(null)

    const svar = await PATCH(patchRequest({ typ: 'uppdatera_kund', data: { id: 'kund-1' } }))

    expect(svar.status).toBe(401)
    expect(await svar.json()).toEqual({ ok: false })
    expect(uppdateraOperativKundMock).not.toHaveBeenCalled()
  })

  it('nekar PATCH från annat origin innan sessionen används', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')

    const svar = await PATCH(
      new NextRequest('https://admin.nova-it.se/api/admin/operativt', {
        method: 'PATCH',
        headers: {
          origin: 'https://angripare.example',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ typ: 'uppdatera_kund', data: { id: 'kund-1' } }),
      }),
    )

    expect(svar.status).toBe(403)
    expect(hamtaAutentiseradAnvandarIdMock).not.toHaveBeenCalled()
  })

  it('returnerar 400 vid okänd PATCH-typ', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')

    const svar = await PATCH(patchRequest({ typ: 'massuppdatera', data: {} }))

    expect(svar.status).toBe(400)
    expect(await svar.json()).toEqual({ ok: false })
  })

  it('returnerar 400 vid trasig (icke-JSON) PATCH-body i stället för att krascha', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')

    const trasigRequest = new NextRequest('https://admin.nova-it.se/api/admin/operativt', {
      method: 'PATCH',
      headers: {
        origin: 'https://admin.nova-it.se',
        'content-type': 'application/json',
      },
      body: '{ inte giltig json',
    })
    const svar = await PATCH(trasigRequest)

    expect(svar.status).toBe(400)
    expect(await svar.json()).toEqual({ ok: false })
    expect(uppdateraOperativKundMock).not.toHaveBeenCalled()
  })

  it('returnerar 400 om PATCH-payload saknar typ/data-formen', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')

    const svar = await PATCH(patchRequest(null))

    expect(svar.status).toBe(400)
    expect(await svar.json()).toEqual({ ok: false })
  })

  it('nekar uppdatera_kund för medarbetare (saknar redigera_kund)', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('medarbetare')

    const svar = await PATCH(
      patchRequest({ typ: 'uppdatera_kund', data: { id: 'kund-1', andringar: { epost: 'ny@example.com' } } }),
    )

    expect(svar.status).toBe(403)
    expect(uppdateraOperativKundMock).not.toHaveBeenCalled()
  })

  it('nekar tilldelning (ansvarigId) för medarbetare (saknar tilldela_arende)', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('medarbetare')

    const svar = await PATCH(
      patchRequest({
        typ: 'uppdatera_arende',
        data: {
          id: 'arende-1',
          andringar: { ansvarigId: 'user-2' },
          aktivitet: { typ: 'tilldelning', beskrivning: 'Tilldelades', aktor: 'Tekniker' },
        },
      }),
    )

    expect(svar.status).toBe(403)
    expect(uppdateraOperativtArendeMock).not.toHaveBeenCalled()
  })

  it('tillåter status-/prioritetsändring (utan ansvarigId) för medarbetare', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('medarbetare')
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

    const svar = await PATCH(
      patchRequest({
        typ: 'uppdatera_arende',
        data: {
          id: 'arende-1',
          andringar: { status: 'pagaende' },
          aktivitet: { typ: 'status', beskrivning: 'Status ändrades', aktor: 'Tekniker' },
        },
      }),
    )

    expect(svar.status).toBe(200)
    expect(uppdateraOperativtArendeMock).toHaveBeenCalled()
  })

  it('uppdaterar kund, bokning och ärende för admin', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')
    uppdateraOperativKundMock.mockResolvedValue({ ...kundStomme, epost: 'ny@example.com' })
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
      (await PATCH(patchRequest({ typ: 'uppdatera_arende', data: { id: 'arende-1', andringar: { ansvarigId: 'user-2' }, aktivitet: { typ: 'tilldelning', beskrivning: 'Tilldelades', aktor: 'Admin' } } }))).json(),
    ).resolves.toMatchObject({ ok: true, arende: { id: 'arende-1' } })
    expect(uppdateraOperativBokningMock).toHaveBeenCalledWith(
      'bokning-1',
      { status: 'bekraftad' },
      'Verifierad Admin',
    )
    expect(uppdateraOperativtArendeMock).toHaveBeenCalledWith(
      'arende-1',
      { ansvarigId: 'user-2' },
      expect.objectContaining({ aktor: 'Verifierad Admin' }),
    )
  })

  it('avbokar bokning för admin', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')
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
    expect(avbokaOperativBokningMock).toHaveBeenCalledWith('bokning-1', 'Verifierad Admin')
  })

  it('använder verifierat profilnamn i stället för klientens namn vid SMS', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')
    skickaKlarForUpphamtningSmsMock.mockResolvedValue({ skickat: true, till: '+46700000000' })

    const svar = await PATCH(
      patchRequest({ typ: 'skicka_sms', data: { arendeId: 'arende-1', aktor: 'Förfalskat namn' } }),
    )

    expect(svar.status).toBe(200)
    expect(skickaKlarForUpphamtningSmsMock).toHaveBeenCalledWith(
      'arende-1',
      'Verifierad Admin',
    )
  })

  it('skickar nya inloggningsuppgifter för admin, med verifierat profilnamn', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')
    skickaNyaInloggningsuppgifterForArendeMock.mockResolvedValue({
      kontoSkapat: false,
      kontoAterstallt: true,
      utskickSkickat: true,
    })

    const svar = await PATCH(
      patchRequest({
        typ: 'skicka_inloggningsuppgifter',
        data: { arendeId: 'arende-1', aktor: 'Förfalskat namn' },
      }),
    )

    expect(svar.status).toBe(200)
    expect(await svar.json()).toEqual({
      ok: true,
      resultat: { kontoSkapat: false, kontoAterstallt: true, utskickSkickat: true },
    })
    expect(skickaNyaInloggningsuppgifterForArendeMock).toHaveBeenCalledWith(
      'arende-1',
      'Verifierad Admin',
    )
  })

  it('nekar skicka_inloggningsuppgifter för medarbetare (saknar redigera_kund)', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('medarbetare')

    const svar = await PATCH(
      patchRequest({ typ: 'skicka_inloggningsuppgifter', data: { arendeId: 'arende-1', aktor: 'Tekniker' } }),
    )

    expect(svar.status).toBe(403)
    expect(skickaNyaInloggningsuppgifterForArendeMock).not.toHaveBeenCalled()
  })

  it('uppdaterar och tar bort kundanteckning för admin', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')
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

  it('nekar ta_bort_kund och ta_bort_arenden för medarbetare (saknar administratörsbehörighet)', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('medarbetare')

    const kundSvar = await PATCH(patchRequest({ typ: 'ta_bort_kund', data: { id: 'kund-1' } }))
    expect(kundSvar.status).toBe(403)
    expect(taBortOperativKundMock).not.toHaveBeenCalled()

    const arendenSvar = await PATCH(patchRequest({ typ: 'ta_bort_arenden', data: { ids: ['arende-1'] } }))
    expect(arendenSvar.status).toBe(403)
    expect(taBortOperativArendenMock).not.toHaveBeenCalled()
  })

  it('tar bort kund och ärenden för administratör', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')
    taBortOperativKundMock.mockResolvedValue({ id: 'kund-1', kundportalKontoSparratMisslyckades: false })
    taBortOperativArendenMock.mockResolvedValue(['arende-1', 'arende-2'])

    await expect(
      (await PATCH(patchRequest({ typ: 'ta_bort_kund', data: { id: 'kund-1' } }))).json(),
    ).resolves.toEqual({ ok: true, id: 'kund-1', kundportalKontoSparratMisslyckades: false })

    await expect(
      (
        await PATCH(patchRequest({ typ: 'ta_bort_arenden', data: { ids: ['arende-1', 'arende-2'] } }))
      ).json(),
    ).resolves.toEqual({ ok: true, ids: ['arende-1', 'arende-2'] })
  })

  it('returnerar 400 för ta_bort_arenden med ogiltig payload', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    hamtaRollFranDatabasenMock.mockResolvedValue('administrator')

    const svar = await PATCH(patchRequest({ typ: 'ta_bort_arenden', data: { ids: 'inte-en-array' } }))
    expect(svar.status).toBe(400)
    expect(taBortOperativArendenMock).not.toHaveBeenCalled()
  })
})
