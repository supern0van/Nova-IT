import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from './route'
import { KundArendeFel, hamtaKundArenden } from '@/lib/admin/kundarenden-server'

vi.mock('@/lib/admin/kundarenden-server', () => ({
  KundArendeFel: class KundArendeFel extends Error {
    status: number
    constructor(message: string, status = 400) {
      super(message)
      this.status = status
    }
  },
  hamtaKundArenden: vi.fn(),
}))

const hamtaKundArendenMock = vi.mocked(hamtaKundArenden)

const GILTIG_HEMLIGHET = 'test-hemlighet-minst-16-tecken'

function request(adminKundId: string | null, headers: Record<string, string> = {}) {
  const url = new URL('https://admin.nova-it.se/api/internal/kundarenden')
  if (adminKundId) url.searchParams.set('adminKundId', adminKundId)
  return new NextRequest(url, { headers })
}

describe('/api/internal/kundarenden', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMINPORTAL_INTAG_SECRET = GILTIG_HEMLIGHET
  })

  it('returnerar 500 utan att hämta något om ADMINPORTAL_INTAG_SECRET saknas', async () => {
    delete process.env.ADMINPORTAL_INTAG_SECRET

    const svar = await GET(request('kund-1', { 'x-adminportal-intag-secret': GILTIG_HEMLIGHET }))

    expect(svar.status).toBe(500)
    expect(hamtaKundArendenMock).not.toHaveBeenCalled()
  })

  it('returnerar 401 utan giltig hemlighet', async () => {
    const svar = await GET(request('kund-1', { 'x-adminportal-intag-secret': 'fel-hemlighet' }))

    expect(svar.status).toBe(401)
    expect(hamtaKundArendenMock).not.toHaveBeenCalled()
  })

  it('returnerar 400 om adminKundId saknas', async () => {
    const svar = await GET(request(null, { 'x-adminportal-intag-secret': GILTIG_HEMLIGHET }))

    expect(svar.status).toBe(400)
    expect(hamtaKundArendenMock).not.toHaveBeenCalled()
  })

  it('returnerar kundens ärenden vid giltig hemlighet', async () => {
    hamtaKundArendenMock.mockResolvedValue([
      {
        id: 'arende-1',
        arendenummer: 'NIT-1001',
        rubrik: 'Wi-Fi',
        status: 'pagaende',
        prioritet: 'normal',
        skapad: '2026-07-29T10:00:00.000Z',
        uppdaterad: '2026-07-29T10:00:00.000Z',
      },
    ])

    const svar = await GET(request('kund-1', { 'x-adminportal-intag-secret': GILTIG_HEMLIGHET }))
    const kropp = await svar.json()

    expect(svar.status).toBe(200)
    expect(kropp.ok).toBe(true)
    expect(kropp.arenden).toHaveLength(1)
    expect(hamtaKundArendenMock).toHaveBeenCalledWith('kund-1')
  })

  it('mappar KundArendeFel till dess status', async () => {
    hamtaKundArendenMock.mockRejectedValue(new KundArendeFel('databasfel', 500))

    const svar = await GET(request('kund-1', { 'x-adminportal-intag-secret': GILTIG_HEMLIGHET }))

    expect(svar.status).toBe(500)
  })
})
