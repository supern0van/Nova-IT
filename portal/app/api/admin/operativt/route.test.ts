import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from './route'
import { harAdminAtkomst } from '@/lib/auth/profiler-server'
import { hamtaOperativAdminData } from '@/lib/admin/operativa-server'
import { hamtaAutentiseradAnvandarId } from '@/lib/supabase/route-anvandare'

vi.mock('@/lib/supabase/route-anvandare', () => ({ hamtaAutentiseradAnvandarId: vi.fn() }))
vi.mock('@/lib/auth/profiler-server', () => ({ harAdminAtkomst: vi.fn() }))
vi.mock('@/lib/admin/operativa-server', () => ({ hamtaOperativAdminData: vi.fn() }))

const hamtaAutentiseradAnvandarIdMock = vi.mocked(hamtaAutentiseradAnvandarId)
const harAdminAtkomstMock = vi.mocked(harAdminAtkomst)
const hamtaOperativAdminDataMock = vi.mocked(hamtaOperativAdminData)

function request() {
  return new NextRequest('https://admin.nova-it.se/api/admin/operativt')
}

describe('/api/admin/operativt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returnerar 401 utan AAL2-session', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue(null)

    const svar = await GET(request())

    expect(svar.status).toBe(401)
    expect(await svar.json()).toEqual({ kunder: [], arenden: [], bokningar: [] })
    expect(harAdminAtkomstMock).not.toHaveBeenCalled()
  })

  it('returnerar 403 för icke-admin', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    harAdminAtkomstMock.mockResolvedValue(false)

    const svar = await GET(request())

    expect(svar.status).toBe(403)
    expect(await svar.json()).toEqual({ kunder: [], arenden: [], bokningar: [] })
    expect(hamtaOperativAdminDataMock).not.toHaveBeenCalled()
  })

  it('returnerar operativ data för admin', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    harAdminAtkomstMock.mockResolvedValue(true)
    hamtaOperativAdminDataMock.mockResolvedValue({
      kunder: [],
      arenden: [],
      bokningar: [],
    })

    const svar = await GET(request())

    expect(svar.status).toBe(200)
    expect(await svar.json()).toEqual({ kunder: [], arenden: [], bokningar: [] })
  })

  it('fail-closed om adminrollen inte kan läsas', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    harAdminAtkomstMock.mockRejectedValue(new Error('roll nere'))

    const svar = await GET(request())

    expect(svar.status).toBe(500)
    expect(await svar.json()).toEqual({ kunder: [], arenden: [], bokningar: [] })
  })

  it('fail-closed om operativa tabeller inte kan läsas', async () => {
    hamtaAutentiseradAnvandarIdMock.mockResolvedValue('user-1')
    harAdminAtkomstMock.mockResolvedValue(true)
    hamtaOperativAdminDataMock.mockRejectedValue(new Error('tabell saknas'))

    const svar = await GET(request())

    expect(svar.status).toBe(500)
    expect(await svar.json()).toEqual({ kunder: [], arenden: [], bokningar: [] })
  })
})
