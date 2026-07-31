import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from './route'
import { KundArendeFel, hamtaKundIdForArendenummer } from '@/lib/admin/kundarenden-server'

vi.mock('@/lib/admin/kundarenden-server', () => ({
  KundArendeFel: class KundArendeFel extends Error {
    status: number
    constructor(message: string, status = 400) {
      super(message)
      this.status = status
    }
  },
  hamtaKundIdForArendenummer: vi.fn(),
}))

const hamtaKundIdForArendenummerMock = vi.mocked(hamtaKundIdForArendenummer)

const GILTIG_HEMLIGHET = 'test-hemlighet-minst-16-tecken'

function request(arendenummer: string | null, headers: Record<string, string> = {}) {
  const url = new URL('https://admin.nova-it.se/api/internal/kundidforarendenummer')
  if (arendenummer) url.searchParams.set('arendenummer', arendenummer)
  return new NextRequest(url, { headers })
}

describe('/api/internal/kundidforarendenummer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMINPORTAL_INTAG_SECRET = GILTIG_HEMLIGHET
  })

  it('returnerar 500 utan att slå upp något om ADMINPORTAL_INTAG_SECRET saknas', async () => {
    delete process.env.ADMINPORTAL_INTAG_SECRET

    const svar = await GET(request('NIT-1001', { 'x-adminportal-intag-secret': GILTIG_HEMLIGHET }))

    expect(svar.status).toBe(500)
    expect(hamtaKundIdForArendenummerMock).not.toHaveBeenCalled()
  })

  it('returnerar 401 utan giltig hemlighet', async () => {
    const svar = await GET(request('NIT-1001', { 'x-adminportal-intag-secret': 'fel-hemlighet' }))

    expect(svar.status).toBe(401)
    expect(hamtaKundIdForArendenummerMock).not.toHaveBeenCalled()
  })

  it('returnerar 400 om arendenummer saknas', async () => {
    const svar = await GET(request(null, { 'x-adminportal-intag-secret': GILTIG_HEMLIGHET }))

    expect(svar.status).toBe(400)
    expect(hamtaKundIdForArendenummerMock).not.toHaveBeenCalled()
  })

  it('returnerar 404 om ärendenumret inte finns', async () => {
    hamtaKundIdForArendenummerMock.mockResolvedValue(null)

    const svar = await GET(request('NIT-9999', { 'x-adminportal-intag-secret': GILTIG_HEMLIGHET }))

    expect(svar.status).toBe(404)
  })

  it('returnerar adminKundId vid träff', async () => {
    hamtaKundIdForArendenummerMock.mockResolvedValue('kund-1')

    const svar = await GET(request('NIT-1001', { 'x-adminportal-intag-secret': GILTIG_HEMLIGHET }))
    const kropp = await svar.json()

    expect(svar.status).toBe(200)
    expect(kropp).toEqual({ ok: true, adminKundId: 'kund-1' })
    expect(hamtaKundIdForArendenummerMock).toHaveBeenCalledWith('NIT-1001')
  })

  it('mappar KundArendeFel till dess status', async () => {
    hamtaKundIdForArendenummerMock.mockRejectedValue(new KundArendeFel('databasfel', 500))

    const svar = await GET(request('NIT-1001', { 'x-adminportal-intag-secret': GILTIG_HEMLIGHET }))

    expect(svar.status).toBe(500)
  })
})
