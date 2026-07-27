import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { hamtaAutentiseradAnvandarId, harAdminAtkomst, hamtaSystemStatus } = vi.hoisted(() => ({
  hamtaAutentiseradAnvandarId: vi.fn(),
  harAdminAtkomst: vi.fn(),
  hamtaSystemStatus: vi.fn(),
}))

vi.mock('@/lib/supabase/route-anvandare', () => ({ hamtaAutentiseradAnvandarId }))
vi.mock('@/lib/auth/profiler-server', () => ({ harAdminAtkomst }))
vi.mock('@/lib/admin/system-status-server', () => ({ hamtaSystemStatus }))

import { GET } from './route'

function begaran() {
  return new NextRequest('https://admin.nova-it.se/api/admin/systemstatus')
}

describe('/api/admin/systemstatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('nekar anrop utan giltig aal2-session', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue(null)

    const svar = await GET(begaran())

    expect(svar.status).toBe(401)
    expect(await svar.json()).toEqual({ status: null })
    expect(harAdminAtkomst).not.toHaveBeenCalled()
  })

  it('nekar medarbetare även om sessionen är giltig', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(false)

    const svar = await GET(begaran())

    expect(svar.status).toBe(403)
    expect(await svar.json()).toEqual({ status: null })
    expect(hamtaSystemStatus).not.toHaveBeenCalled()
  })

  it('returnerar systemstatus för administrator', async () => {
    const status = {
      kontroller: [
        {
          id: 'profiles-read',
          namn: 'Profiles-tabellen',
          status: 'ok',
          beskrivning: 'Worker:n kan läsa portalkonton från Supabase.',
        },
      ],
      profiler: { antal: 2, status: 'ok' },
    }

    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)
    hamtaSystemStatus.mockResolvedValue(status)

    const svar = await GET(begaran())

    expect(svar.status).toBe(200)
    expect(await svar.json()).toEqual({ status })
  })
})
