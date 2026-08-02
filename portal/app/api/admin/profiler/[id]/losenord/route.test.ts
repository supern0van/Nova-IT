import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  hamtaAutentiseradAnvandarId,
  harAdminAtkomst,
  skickaLosenordsaterstallningForProfil,
} = vi.hoisted(() => ({
  hamtaAutentiseradAnvandarId: vi.fn(),
  harAdminAtkomst: vi.fn(),
  skickaLosenordsaterstallningForProfil: vi.fn(),
}))

vi.mock('@/lib/supabase/route-anvandare', () => ({ hamtaAutentiseradAnvandarId }))
vi.mock('@/lib/auth/profiler-server', () => ({
  harAdminAtkomst,
  skickaLosenordsaterstallningForProfil,
}))

import { POST } from './route'

function begaran(url = 'https://admin.nova-it.se/api/admin/profiler/user-2/losenord') {
  return new NextRequest(url, {
    method: 'POST',
    headers: { origin: new URL(url).origin },
  })
}

function context(id = 'user-2') {
  return { params: Promise.resolve({ id }) }
}

describe('POST /api/admin/profiler/[id]/losenord', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('nekar anrop utan giltig aal2-session', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue(null)

    const svar = await POST(begaran(), context())

    expect(svar.status).toBe(401)
    expect(await svar.json()).toEqual({ ok: false })
    expect(harAdminAtkomst).not.toHaveBeenCalled()
  })

  it('nekar återställningslänk från annat origin innan sessionen används', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')

    const svar = await POST(
      new NextRequest('https://admin.nova-it.se/api/admin/profiler/user-2/losenord', {
        method: 'POST',
        headers: { origin: 'https://angripare.example' },
      }),
      context(),
    )

    expect(svar.status).toBe(403)
    expect(hamtaAutentiseradAnvandarId).not.toHaveBeenCalled()
  })

  it('nekar medarbetare även med giltig session', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(false)

    const svar = await POST(begaran(), context())

    expect(svar.status).toBe(403)
    expect(await svar.json()).toEqual({ ok: false })
    expect(skickaLosenordsaterstallningForProfil).not.toHaveBeenCalled()
  })

  it('fail-closed om administratörskontrollen kastar', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockRejectedValue(new Error('roll nere'))

    const svar = await POST(begaran(), context())

    expect(svar.status).toBe(500)
    expect(await svar.json()).toEqual({ ok: false })
    expect(skickaLosenordsaterstallningForProfil).not.toHaveBeenCalled()
  })

  it('nekar tomt profil-id innan återställningslänk skapas', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)

    const svar = await POST(begaran(), context('   '))

    expect(svar.status).toBe(400)
    expect(await svar.json()).toEqual({ ok: false })
    expect(skickaLosenordsaterstallningForProfil).not.toHaveBeenCalled()
  })

  it('returnerar 404 om portalkontot saknas', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)
    skickaLosenordsaterstallningForProfil.mockResolvedValue({
      ok: false,
      fel: 'profil_saknas',
    })

    const svar = await POST(begaran(), context())

    expect(svar.status).toBe(404)
    expect(await svar.json()).toEqual({
      ok: false,
      fel: 'Hittade inget portalkonto för återställningen.',
    })
  })

  it('fail-closed om återställningslänken kastar ett oväntat fel', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)
    skickaLosenordsaterstallningForProfil.mockRejectedValue(new Error('auth nere'))

    const svar = await POST(begaran(), context())

    expect(svar.status).toBe(500)
    expect(await svar.json()).toEqual({
      ok: false,
      fel: 'Kunde inte skicka återställningslänken.',
    })
  })

  it('skickar lösenordsåterställning för administrator', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)
    skickaLosenordsaterstallningForProfil.mockResolvedValue({
      ok: true,
      epost: 'medarbetare@nova-it.se',
    })

    const svar = await POST(begaran(), context())

    expect(svar.status).toBe(200)
    expect(await svar.json()).toEqual({ ok: true, epost: 'medarbetare@nova-it.se' })
    expect(skickaLosenordsaterstallningForProfil).toHaveBeenCalledWith(
      'user-2',
      'https://admin.nova-it.se/logga-in?aterstall=1',
    )
  })

  it('använder säker fallback-origin för återställningslänk om host inte är en Worker-domän', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)
    skickaLosenordsaterstallningForProfil.mockResolvedValue({
      ok: true,
      epost: 'medarbetare@nova-it.se',
    })

    const svar = await POST(
      begaran('https://extern.example/api/admin/profiler/user-2/losenord'),
      context(),
    )

    expect(svar.status).toBe(200)
    expect(skickaLosenordsaterstallningForProfil).toHaveBeenCalledWith(
      'user-2',
      'https://admin.nova-it.se/logga-in?aterstall=1',
    )
  })
})
