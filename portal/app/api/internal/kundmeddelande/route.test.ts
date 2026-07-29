import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from './route'
import { KundArendeFel, skapaKundMeddelande } from '@/lib/admin/kundarenden-server'

vi.mock('@/lib/admin/kundarenden-server', () => ({
  KundArendeFel: class KundArendeFel extends Error {
    status: number
    constructor(message: string, status = 400) {
      super(message)
      this.status = status
    }
  },
  skapaKundMeddelande: vi.fn(),
}))

const skapaKundMeddelandeMock = vi.mocked(skapaKundMeddelande)

const GILTIG_HEMLIGHET = 'test-hemlighet-minst-16-tecken'

function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('https://admin.nova-it.se/api/internal/kundmeddelande', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

const giltigPayload = { adminKundId: 'kund-1', arendeId: 'arende-1', text: 'Tack, det löste sig!' }

describe('/api/internal/kundmeddelande', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMINPORTAL_INTAG_SECRET = GILTIG_HEMLIGHET
  })

  it('returnerar 401 utan giltig hemlighet', async () => {
    const svar = await POST(request(giltigPayload, { 'x-adminportal-intag-secret': 'fel' }))

    expect(svar.status).toBe(401)
    expect(skapaKundMeddelandeMock).not.toHaveBeenCalled()
  })

  it('returnerar 400 vid ofullständig payload', async () => {
    const svar = await POST(
      request({ adminKundId: 'kund-1' }, { 'x-adminportal-intag-secret': GILTIG_HEMLIGHET }),
    )

    expect(svar.status).toBe(400)
    expect(skapaKundMeddelandeMock).not.toHaveBeenCalled()
  })

  it('sparar meddelandet vid giltig payload', async () => {
    skapaKundMeddelandeMock.mockResolvedValue({
      id: 'm1',
      avsandare: 'kund',
      avsandareNamn: 'Anna Andersson',
      text: giltigPayload.text,
      tidpunkt: '2026-07-29T10:00:00.000Z',
    })

    const svar = await POST(request(giltigPayload, { 'x-adminportal-intag-secret': GILTIG_HEMLIGHET }))
    const kropp = await svar.json()

    expect(svar.status).toBe(200)
    expect(kropp.ok).toBe(true)
    expect(skapaKundMeddelandeMock).toHaveBeenCalledWith({
      adminKundId: 'kund-1',
      arendeId: 'arende-1',
      text: giltigPayload.text,
    })
  })

  it('mappar KundArendeFel (t.ex. stängt ärende) till dess status', async () => {
    skapaKundMeddelandeMock.mockRejectedValue(new KundArendeFel('Ärendet är stängt.', 409))

    const svar = await POST(request(giltigPayload, { 'x-adminportal-intag-secret': GILTIG_HEMLIGHET }))

    expect(svar.status).toBe(409)
  })
})
