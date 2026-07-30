import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from './route'
import { uppdateraKontaktpreferenser } from '@/lib/admin/operativa-server'

vi.mock('@/lib/admin/operativa-server', () => ({
  uppdateraKontaktpreferenser: vi.fn(),
}))

const uppdateraKontaktpreferenserMock = vi.mocked(uppdateraKontaktpreferenser)

const GILTIG_HEMLIGHET = 'test-hemlighet-minst-16-tecken'

function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('https://admin.nova-it.se/api/internal/kundpreferenser', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

const giltigPayload = {
  adminKundId: 'kund-1',
  kontaktUppdateringEpost: true,
  kontaktUppdateringSms: false,
  kontaktKlartEpost: true,
  kontaktKlartSms: true,
}

describe('/api/internal/kundpreferenser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMINPORTAL_INTAG_SECRET = GILTIG_HEMLIGHET
  })

  it('returnerar 401 utan giltig hemlighet', async () => {
    const svar = await POST(request(giltigPayload, { 'x-adminportal-intag-secret': 'fel' }))

    expect(svar.status).toBe(401)
    expect(uppdateraKontaktpreferenserMock).not.toHaveBeenCalled()
  })

  it('returnerar 400 vid ofullständig payload', async () => {
    const svar = await POST(
      request({ adminKundId: 'kund-1' }, { 'x-adminportal-intag-secret': GILTIG_HEMLIGHET }),
    )

    expect(svar.status).toBe(400)
    expect(uppdateraKontaktpreferenserMock).not.toHaveBeenCalled()
  })

  it('uppdaterar preferenserna vid giltig payload', async () => {
    uppdateraKontaktpreferenserMock.mockResolvedValue(true)

    const svar = await POST(request(giltigPayload, { 'x-adminportal-intag-secret': GILTIG_HEMLIGHET }))
    const kropp = await svar.json()

    expect(svar.status).toBe(200)
    expect(kropp.ok).toBe(true)
    expect(uppdateraKontaktpreferenserMock).toHaveBeenCalledWith({
      adminKundId: 'kund-1',
      kontaktUppdateringEpost: true,
      kontaktUppdateringSms: false,
      kontaktKlartEpost: true,
      kontaktKlartSms: true,
    })
  })

  it('returnerar 500 om uppdateringen misslyckas', async () => {
    uppdateraKontaktpreferenserMock.mockResolvedValue(false)

    const svar = await POST(request(giltigPayload, { 'x-adminportal-intag-secret': GILTIG_HEMLIGHET }))

    expect(svar.status).toBe(500)
  })
})
