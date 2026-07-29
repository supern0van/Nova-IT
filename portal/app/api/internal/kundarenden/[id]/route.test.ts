import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from './route'
import { hamtaKundArende } from '@/lib/admin/kundarenden-server'

vi.mock('@/lib/admin/kundarenden-server', () => ({
  KundArendeFel: class KundArendeFel extends Error {
    status: number
    constructor(message: string, status = 400) {
      super(message)
      this.status = status
    }
  },
  hamtaKundArende: vi.fn(),
}))

const hamtaKundArendeMock = vi.mocked(hamtaKundArende)

const GILTIG_HEMLIGHET = 'test-hemlighet-minst-16-tecken'

function request(adminKundId: string | null, headers: Record<string, string> = {}) {
  const url = new URL('https://admin.nova-it.se/api/internal/kundarenden/arende-1')
  if (adminKundId) url.searchParams.set('adminKundId', adminKundId)
  return new NextRequest(url, { headers })
}

function params(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('/api/internal/kundarenden/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMINPORTAL_INTAG_SECRET = GILTIG_HEMLIGHET
  })

  it('returnerar 401 utan giltig hemlighet', async () => {
    const svar = await GET(request('kund-1', { 'x-adminportal-intag-secret': 'fel' }), params('arende-1'))

    expect(svar.status).toBe(401)
    expect(hamtaKundArendeMock).not.toHaveBeenCalled()
  })

  it('returnerar 404 om ärendet inte finns eller tillhör en annan kund', async () => {
    hamtaKundArendeMock.mockResolvedValue(null)

    const svar = await GET(
      request('kund-1', { 'x-adminportal-intag-secret': GILTIG_HEMLIGHET }),
      params('arende-1'),
    )

    expect(svar.status).toBe(404)
  })

  it('returnerar ärendet med konversation vid träff', async () => {
    hamtaKundArendeMock.mockResolvedValue({
      id: 'arende-1',
      arendenummer: 'NIT-1001',
      rubrik: 'Wi-Fi',
      status: 'pagaende',
      prioritet: 'normal',
      skapad: '2026-07-29T10:00:00.000Z',
      uppdaterad: '2026-07-29T10:00:00.000Z',
      meddelanden: [
        {
          id: 'm1',
          avsandare: 'kund',
          avsandareNamn: 'Anna Andersson',
          text: 'Wi-Fi faller bort.',
          tidpunkt: '2026-07-29T10:00:00.000Z',
        },
      ],
    })

    const svar = await GET(
      request('kund-1', { 'x-adminportal-intag-secret': GILTIG_HEMLIGHET }),
      params('arende-1'),
    )
    const kropp = await svar.json()

    expect(svar.status).toBe(200)
    expect(kropp.arende.meddelanden).toHaveLength(1)
    expect(hamtaKundArendeMock).toHaveBeenCalledWith('kund-1', 'arende-1')
  })
})
