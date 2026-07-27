import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  bjudInPortalProfil,
  hamtaAutentiseradAnvandarId,
  harAdminAtkomst,
  listaProfilerFranDatabasen,
} = vi.hoisted(() => ({
  bjudInPortalProfil: vi.fn(),
  hamtaAutentiseradAnvandarId: vi.fn(),
  harAdminAtkomst: vi.fn(),
  listaProfilerFranDatabasen: vi.fn(),
}))

vi.mock('@/lib/supabase/route-anvandare', () => ({ hamtaAutentiseradAnvandarId }))
vi.mock('@/lib/auth/profiler-server', () => ({
  bjudInPortalProfil,
  harAdminAtkomst,
  listaProfilerFranDatabasen,
}))

import { GET, POST } from './route'

function begaran(body?: unknown) {
  return new NextRequest('https://admin.nova-it.se/api/admin/profiler', {
    method: body === undefined ? 'GET' : 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
  })
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

  it('nekar inbjudan utan giltig aal2-session', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue(null)

    const svar = await POST(begaran({ namn: 'Ny Admin', epost: 'ny@nova-it.se', roll: 'medarbetare' }))
    const body = await svar.json()

    expect(svar.status).toBe(401)
    expect(body).toEqual({ profil: null })
    expect(bjudInPortalProfil).not.toHaveBeenCalled()
  })

  it('nekar inbjudan från medarbetare', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-2')
    harAdminAtkomst.mockResolvedValue(false)

    const svar = await POST(begaran({ namn: 'Ny Admin', epost: 'ny@nova-it.se', roll: 'medarbetare' }))
    const body = await svar.json()

    expect(svar.status).toBe(403)
    expect(body).toEqual({ profil: null })
    expect(bjudInPortalProfil).not.toHaveBeenCalled()
  })

  it('nekar ogiltig inbjudningspayload', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)

    const svar = await POST(begaran({ namn: 'A', epost: 'inte-epost', roll: 'tekniker' }))
    const body = await svar.json()

    expect(svar.status).toBe(400)
    expect(body).toEqual({
      profil: null,
      fel: 'Ange namn, giltig e-postadress och systemroll.',
    })
    expect(bjudInPortalProfil).not.toHaveBeenCalled()
  })

  it('returnerar 409 om portalkontot redan finns', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)
    bjudInPortalProfil.mockResolvedValue({ ok: false, fel: 'finns_redan' })

    const svar = await POST(begaran({ namn: 'Ny Admin', epost: 'ny@nova-it.se', roll: 'medarbetare' }))
    const body = await svar.json()

    expect(svar.status).toBe(409)
    expect(body).toEqual({ profil: null, fel: 'finns_redan' })
  })

  it('bjuder in ett nytt portalkonto för administrator', async () => {
    const profil = {
      id: 'user-3',
      epost: 'ny@nova-it.se',
      namn: 'Ny Admin',
      roll: 'medarbetare',
      skapad: '2026-07-28T00:00:00.000Z',
      uppdaterad: '2026-07-28T00:00:00.000Z',
    }

    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)
    bjudInPortalProfil.mockResolvedValue({ ok: true, profil })

    const svar = await POST(begaran({ namn: 'Ny Admin', epost: 'NY@NOVA-IT.SE', roll: 'medarbetare' }))
    const body = await svar.json()

    expect(svar.status).toBe(201)
    expect(body).toEqual({ profil })
    expect(bjudInPortalProfil).toHaveBeenCalledWith({
      namn: 'Ny Admin',
      epost: 'NY@NOVA-IT.SE',
      roll: 'medarbetare',
      redirectTo: 'https://admin.nova-it.se/logga-in?aterstall=1',
    })
  })
})
