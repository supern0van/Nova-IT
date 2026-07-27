import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  hamtaAutentiseradAnvandarId,
  harAdminAtkomst,
  listaProfilerFranDatabasen,
} = vi.hoisted(() => ({
  hamtaAutentiseradAnvandarId: vi.fn(),
  harAdminAtkomst: vi.fn(),
  listaProfilerFranDatabasen: vi.fn(),
}))

vi.mock('@/lib/supabase/route-anvandare', () => ({ hamtaAutentiseradAnvandarId }))
vi.mock('@/lib/auth/profiler-server', () => ({
  harAdminAtkomst,
  listaProfilerFranDatabasen,
}))

import { GET } from './route'

function begaran() {
  return new NextRequest('https://admin.nova-it.se/api/admin/profiler')
}

describe('/api/admin/profiler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('nekar anrop utan giltig aal2-session', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue(null)

    const svar = await GET(begaran())
    const body = await svar.json()

    expect(svar.status).toBe(401)
    expect(body).toEqual({ profiler: [] })
    expect(harAdminAtkomst).not.toHaveBeenCalled()
  })

  it('nekar medarbetare även om sessionen är giltig', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(false)

    const svar = await GET(begaran())
    const body = await svar.json()

    expect(svar.status).toBe(403)
    expect(body).toEqual({ profiler: [] })
    expect(listaProfilerFranDatabasen).not.toHaveBeenCalled()
  })

  it('returnerar profiler för administrator', async () => {
    const profiler = [
      {
        id: 'user-1',
        epost: 'webmaster@nova-it.se',
        namn: 'webmaster',
        roll: 'administrator',
        skapad: '2026-07-27T00:00:00.000Z',
        uppdaterad: '2026-07-27T00:00:00.000Z',
      },
    ]

    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)
    listaProfilerFranDatabasen.mockResolvedValue(profiler)

    const svar = await GET(begaran())
    const body = await svar.json()

    expect(svar.status).toBe(200)
    expect(body).toEqual({ profiler })
  })

  it('fail-closed vid databasfel', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)
    listaProfilerFranDatabasen.mockRejectedValue(new Error('boom'))

    const svar = await GET(begaran())
    const body = await svar.json()

    expect(svar.status).toBe(500)
    expect(body).toEqual({ profiler: [] })
  })
})
