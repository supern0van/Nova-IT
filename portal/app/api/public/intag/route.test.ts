import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PATCH, POST } from './route'
import {
  PubliktIntagFel,
  sattBekraftelseStatus,
  skapaPubliktIntag,
} from '@/lib/admin/publikt-intag-server'

vi.mock('@/lib/admin/publikt-intag-server', () => ({
  PubliktIntagFel: class PubliktIntagFel extends Error {
    status: number
    constructor(message: string, status = 400) {
      super(message)
      this.status = status
    }
  },
  skapaPubliktIntag: vi.fn(),
  sattBekraftelseStatus: vi.fn(),
}))

const skapaPubliktIntagMock = vi.mocked(skapaPubliktIntag)
const sattBekraftelseStatusMock = vi.mocked(sattBekraftelseStatus)

const GILTIG_HEMLIGHET = 'test-hemlighet-minst-16-tecken'

function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('https://admin.nova-it.se/api/public/intag', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

function patchRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('https://admin.nova-it.se/api/public/intag', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

const giltigPayload = {
  kalla: 'kontaktformular',
  namn: 'Anna Andersson',
  epost: 'anna@example.se',
  telefon: '0701234567',
  kundtyp: 'privatperson',
  tjanstSlug: 'it-support',
  angelagenhet: 'normal',
  meddelande: 'Datorn startar inte och ger inget felmeddelande.',
  idempotensnyckel: 'a'.repeat(32),
}

describe('/api/public/intag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.INTAG_SECRET = GILTIG_HEMLIGHET
  })

  it('returnerar 500 utan att skapa något om INTAG_SECRET saknas', async () => {
    delete process.env.INTAG_SECRET

    const svar = await POST(request(giltigPayload, { 'x-intag-secret': GILTIG_HEMLIGHET }))

    expect(svar.status).toBe(500)
    expect(skapaPubliktIntagMock).not.toHaveBeenCalled()
  })

  it('returnerar 401 om hemligheten saknas i anropet', async () => {
    const svar = await POST(request(giltigPayload))

    expect(svar.status).toBe(401)
    expect(await svar.json()).toEqual({ ok: false })
    expect(skapaPubliktIntagMock).not.toHaveBeenCalled()
  })

  it('returnerar 401 om hemligheten är fel, utan att avslöja varför', async () => {
    const svar = await POST(request(giltigPayload, { 'x-intag-secret': 'fel-hemlighet' }))

    expect(svar.status).toBe(401)
    expect(skapaPubliktIntagMock).not.toHaveBeenCalled()
  })

  it('returnerar 400 vid trasig (icke-JSON) body', async () => {
    const trasigRequest = new NextRequest('https://admin.nova-it.se/api/public/intag', {
      method: 'POST',
      headers: { 'x-intag-secret': GILTIG_HEMLIGHET },
      body: '{ inte giltig json',
    })

    const svar = await POST(trasigRequest)

    expect(svar.status).toBe(400)
    expect(skapaPubliktIntagMock).not.toHaveBeenCalled()
  })

  it('skapar ärendet och returnerar ett begränsat svar vid giltigt anrop', async () => {
    skapaPubliktIntagMock.mockResolvedValue({
      arendenummer: 'NIT-2601',
      mottagetVid: '2026-07-29T10:00:00.000Z',
      arendeId: 'arende-internt-id',
      kundEpost: 'anna@example.se',
      kundNamn: 'Anna Andersson',
    })

    const svar = await POST(request(giltigPayload, { 'x-intag-secret': GILTIG_HEMLIGHET }))
    const kropp = await svar.json()

    expect(svar.status).toBe(200)
    expect(kropp.accepted).toBe(true)
    expect(kropp.arendenummer).toBe('NIT-2601')
    expect(kropp.mottagetVid).toBe('2026-07-29T10:00:00.000Z')
    // Interna fält får finnas (används av den publika sajtens e-postutskick)
    // men aldrig kund-id eller prioritet ska läcka till svaret.
    expect(kropp).not.toHaveProperty('kundId')
    expect(kropp).not.toHaveProperty('prioritet')
  })

  it('returnerar kontrollerad status vid valideringsfel, inte råa fel', async () => {
    skapaPubliktIntagMock.mockRejectedValue(new PubliktIntagFel('Ogiltig tjänst.', 400))

    const svar = await POST(request(giltigPayload, { 'x-intag-secret': GILTIG_HEMLIGHET }))
    const kropp = await svar.json()

    expect(svar.status).toBe(400)
    expect(kropp.accepted).toBe(false)
    expect(kropp.fel).toBe('Ogiltig tjänst.')
  })

  it('läcker inte interna felobjekt vid oväntat fel', async () => {
    skapaPubliktIntagMock.mockRejectedValue(new Error('connection refused at 10.0.0.5:5432'))

    const svar = await POST(request(giltigPayload, { 'x-intag-secret': GILTIG_HEMLIGHET }))
    const kropp = await svar.json()

    expect(svar.status).toBe(500)
    expect(JSON.stringify(kropp)).not.toContain('10.0.0.5')
    expect(JSON.stringify(kropp)).not.toContain('connection refused')
  })
})

describe('PATCH /api/public/intag (bekräftelsestatus)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.INTAG_SECRET = GILTIG_HEMLIGHET
  })

  it('returnerar 401 utan giltig hemlighet, uppdaterar inget', async () => {
    const svar = await PATCH(patchRequest({ arendeId: 'arende-1', status: 'skickad' }))

    expect(svar.status).toBe(401)
    expect(sattBekraftelseStatusMock).not.toHaveBeenCalled()
  })

  it('returnerar 400 om arendeId saknas', async () => {
    const svar = await PATCH(
      patchRequest({ status: 'skickad' }, { 'x-intag-secret': GILTIG_HEMLIGHET }),
    )

    expect(svar.status).toBe(400)
    expect(sattBekraftelseStatusMock).not.toHaveBeenCalled()
  })

  it('returnerar 400 för ett ogiltigt statusvärde', async () => {
    const svar = await PATCH(
      patchRequest(
        { arendeId: 'arende-1', status: 'nagot-annat' },
        { 'x-intag-secret': GILTIG_HEMLIGHET },
      ),
    )

    expect(svar.status).toBe(400)
    expect(sattBekraftelseStatusMock).not.toHaveBeenCalled()
  })

  it('uppdaterar status till skickad vid giltigt anrop', async () => {
    const svar = await PATCH(
      patchRequest(
        { arendeId: 'arende-1', status: 'skickad' },
        { 'x-intag-secret': GILTIG_HEMLIGHET },
      ),
    )

    expect(svar.status).toBe(200)
    expect(sattBekraftelseStatusMock).toHaveBeenCalledWith('arende-1', 'skickad')
  })

  it('uppdaterar status till misslyckad vid giltigt anrop', async () => {
    const svar = await PATCH(
      patchRequest(
        { arendeId: 'arende-1', status: 'misslyckad' },
        { 'x-intag-secret': GILTIG_HEMLIGHET },
      ),
    )

    expect(svar.status).toBe(200)
    expect(sattBekraftelseStatusMock).toHaveBeenCalledWith('arende-1', 'misslyckad')
  })
})
