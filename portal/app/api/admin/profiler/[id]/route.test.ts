import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  hamtaAutentiseradAnvandarId,
  harAdminAtkomst,
  uppdateraProfilNamnIDatabasen,
  uppdateraProfilRollIDatabasen,
} = vi.hoisted(() => ({
  hamtaAutentiseradAnvandarId: vi.fn(),
  harAdminAtkomst: vi.fn(),
  uppdateraProfilNamnIDatabasen: vi.fn(),
  uppdateraProfilRollIDatabasen: vi.fn(),
}))

vi.mock('@/lib/supabase/route-anvandare', () => ({ hamtaAutentiseradAnvandarId }))
vi.mock('@/lib/auth/profiler-server', () => ({
  harAdminAtkomst,
  uppdateraProfilNamnIDatabasen,
  uppdateraProfilRollIDatabasen,
}))

import { PATCH } from './route'

function begaran(body: unknown = { roll: 'medarbetare' }) {
  return new NextRequest('https://admin.nova-it.se/api/admin/profiler/user-2', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

function context(id = 'user-2') {
  return { params: Promise.resolve({ id }) }
}

describe('PATCH /api/admin/profiler/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('nekar anrop utan giltig aal2-session', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue(null)

    const svar = await PATCH(begaran(), context())

    expect(svar.status).toBe(401)
    expect(await svar.json()).toEqual({ profil: null })
    expect(harAdminAtkomst).not.toHaveBeenCalled()
  })

  it('nekar ändring av den egna rollen', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)

    const svar = await PATCH(begaran(), context('user-1'))

    expect(svar.status).toBe(400)
    expect(await svar.json()).toEqual({ profil: null })
    expect(uppdateraProfilRollIDatabasen).not.toHaveBeenCalled()
  })

  it('nekar medarbetare även med giltig session', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(false)

    const svar = await PATCH(begaran(), context())

    expect(svar.status).toBe(403)
    expect(await svar.json()).toEqual({ profil: null })
    expect(uppdateraProfilRollIDatabasen).not.toHaveBeenCalled()
  })

  it('nekar ogiltig systemroll', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)

    const svar = await PATCH(begaran({ roll: 'tekniker' }), context())

    expect(svar.status).toBe(400)
    expect(await svar.json()).toEqual({ profil: null })
    expect(uppdateraProfilRollIDatabasen).not.toHaveBeenCalled()
  })

  it('nekar tomt profil-id innan databasen anropas', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)

    const svar = await PATCH(begaran({ roll: 'medarbetare' }), context('   '))

    expect(svar.status).toBe(400)
    expect(await svar.json()).toEqual({ profil: null })
    expect(uppdateraProfilRollIDatabasen).not.toHaveBeenCalled()
    expect(uppdateraProfilNamnIDatabasen).not.toHaveBeenCalled()
  })

  it('uppdaterar systemrollen för ett annat portalkonto', async () => {
    const profil = {
      id: 'user-2',
      epost: 'medarbetare@nova-it.se',
      namn: 'Medarbetare',
      roll: 'medarbetare',
      skapad: '2026-07-27T00:00:00.000Z',
      uppdaterad: '2026-07-27T00:00:00.000Z',
    }

    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)
    uppdateraProfilRollIDatabasen.mockResolvedValue(profil)

    const svar = await PATCH(begaran({ roll: 'medarbetare' }), context())

    expect(svar.status).toBe(200)
    expect(await svar.json()).toEqual({ profil })
    expect(uppdateraProfilRollIDatabasen).toHaveBeenCalledWith('user-2', 'medarbetare')
  })

  it('fail-closed om rolländringen kastar ett oväntat fel', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)
    uppdateraProfilRollIDatabasen.mockRejectedValue(new Error('profiles nere'))

    const svar = await PATCH(begaran({ roll: 'medarbetare' }), context())

    expect(svar.status).toBe(500)
    expect(await svar.json()).toEqual({ profil: null })
  })

  it('nekar payload som försöker ändra både namn och roll samtidigt', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)

    const svar = await PATCH(
      begaran({ namn: 'Nytt Namn', roll: 'medarbetare' }),
      context(),
    )

    expect(svar.status).toBe(400)
    expect(await svar.json()).toEqual({ profil: null })
    expect(uppdateraProfilNamnIDatabasen).not.toHaveBeenCalled()
    expect(uppdateraProfilRollIDatabasen).not.toHaveBeenCalled()
  })

  it('nekar ogiltigt portalkontonamn', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)

    const svar = await PATCH(begaran({ namn: 'A' }), context())

    expect(svar.status).toBe(400)
    expect(await svar.json()).toEqual({ profil: null })
    expect(uppdateraProfilNamnIDatabasen).not.toHaveBeenCalled()
  })

  it('uppdaterar portalkontots namn', async () => {
    const profil = {
      id: 'user-2',
      epost: 'medarbetare@nova-it.se',
      namn: 'Nytt Namn',
      roll: 'medarbetare',
      skapad: '2026-07-27T00:00:00.000Z',
      uppdaterad: '2026-07-28T00:00:00.000Z',
    }

    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    harAdminAtkomst.mockResolvedValue(true)
    uppdateraProfilNamnIDatabasen.mockResolvedValue(profil)

    const svar = await PATCH(begaran({ namn: '  Nytt Namn  ' }), context())

    expect(svar.status).toBe(200)
    expect(await svar.json()).toEqual({ profil })
    expect(uppdateraProfilNamnIDatabasen).toHaveBeenCalledWith('user-2', 'Nytt Namn')
  })
})
