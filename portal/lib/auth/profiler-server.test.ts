import { beforeEach, describe, expect, it, vi } from 'vitest'

const selectProfiler = vi.fn()
const order = vi.fn()
const eq = vi.fn()
const maybeSingle = vi.fn()
const upsert = vi.fn()
const upsertSelect = vi.fn()
const update = vi.fn()
const updateEq = vi.fn()
const updateSelect = vi.fn()
const getUserById = vi.fn()
const updateUserById = vi.fn()
const listUsers = vi.fn()
const inviteUserByEmail = vi.fn()

vi.mock('@/lib/supabase/service', () => ({
  skapaSupabaseServiceklient: () => ({
    from: () => ({
      select: selectProfiler,
      update,
      upsert,
    }),
    auth: {
      admin: {
        getUserById,
        inviteUserByEmail,
        listUsers,
        updateUserById,
      },
    },
  }),
}))

vi.mock('@/lib/auth/roll-server', () => ({
  hamtaRollFranDatabasen: vi.fn(),
}))

let bjudInPortalProfil: typeof import('@/lib/auth/profiler-server').bjudInPortalProfil
let listaProfilerFranDatabasen: typeof import('@/lib/auth/profiler-server').listaProfilerFranDatabasen
let uppdateraProfilNamnIDatabasen: typeof import('@/lib/auth/profiler-server').uppdateraProfilNamnIDatabasen

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  selectProfiler.mockReturnValue({ order })
  eq.mockReturnValue({ maybeSingle })
  update.mockReturnValue({ eq: updateEq })
  updateEq.mockReturnValue({ select: updateSelect })
  updateSelect.mockReturnValue({ maybeSingle })
  upsert.mockReturnValue({ select: upsertSelect })
  upsertSelect.mockReturnValue({ maybeSingle })
  ;({ bjudInPortalProfil, listaProfilerFranDatabasen, uppdateraProfilNamnIDatabasen } =
    await import('@/lib/auth/profiler-server'))
})

describe('listaProfilerFranDatabasen', () => {
  it('berikar profiles-rader med Supabase Auth-kontohälsa', async () => {
    order.mockResolvedValue({
      data: [
        {
          id: 'user-1',
          epost: 'admin@nova-it.se',
          namn: 'Admin',
          roll: 'administrator',
          skapad: '2026-07-27T00:00:00.000Z',
          uppdaterad: '2026-07-27T00:00:00.000Z',
        },
      ],
      error: null,
    })
    listUsers.mockResolvedValue({
      data: {
        users: [
          {
            id: 'user-1',
            email_confirmed_at: '2026-07-27T01:00:00.000Z',
            confirmed_at: null,
            last_sign_in_at: '2026-07-28T01:00:00.000Z',
            created_at: '2026-07-27T00:30:00.000Z',
          },
        ],
      },
      error: null,
    })

    const profiler = await listaProfilerFranDatabasen()

    expect(profiler[0]?.kontoHalsa).toEqual({
      epostBekraftad: true,
      senastInloggad: '2026-07-28T01:00:00.000Z',
      authSkapad: '2026-07-27T00:30:00.000Z',
    })
    expect(listUsers).toHaveBeenCalledWith({ page: 1, perPage: 1000 })
  })

  it('behåller profiler även om Auth-listningen inte kan läsas', async () => {
    order.mockResolvedValue({
      data: [
        {
          id: 'user-2',
          epost: 'medarbetare@nova-it.se',
          namn: 'Medarbetare',
          roll: 'medarbetare',
          skapad: '2026-07-27T00:00:00.000Z',
          uppdaterad: '2026-07-27T00:00:00.000Z',
        },
      ],
      error: null,
    })
    listUsers.mockResolvedValue({ data: { users: [] }, error: new Error('auth nere') })

    const profiler = await listaProfilerFranDatabasen()

    expect(profiler[0]?.kontoHalsa).toBeNull()
  })
})

describe('bjudInPortalProfil', () => {
  it('skickar Supabase-inbjudan och sparar vald systemroll i profiles', async () => {
    selectProfiler.mockReturnValueOnce({ eq })
    maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: {
          id: 'user-3',
          epost: 'ny@nova-it.se',
          namn: 'Ny Admin',
          roll: 'administrator',
          skapad: '2026-07-28T00:00:00.000Z',
          uppdaterad: '2026-07-28T00:00:00.000Z',
        },
        error: null,
      })
    inviteUserByEmail.mockResolvedValue({
      data: {
        user: {
          id: 'user-3',
          email_confirmed_at: null,
          confirmed_at: null,
          last_sign_in_at: null,
          created_at: '2026-07-28T00:00:00.000Z',
        },
      },
      error: null,
    })

    const resultat = await bjudInPortalProfil({
      epost: 'NY@NOVA-IT.SE',
      namn: 'Ny Admin',
      roll: 'administrator',
      redirectTo: 'https://admin.nova-it.se/logga-in?aterstall=1',
    })

    expect(resultat).toEqual({
      ok: true,
      profil: {
        id: 'user-3',
        epost: 'ny@nova-it.se',
        namn: 'Ny Admin',
        roll: 'administrator',
        skapad: '2026-07-28T00:00:00.000Z',
        uppdaterad: '2026-07-28T00:00:00.000Z',
        kontoHalsa: {
          epostBekraftad: false,
          senastInloggad: null,
          authSkapad: '2026-07-28T00:00:00.000Z',
        },
      },
    })
    expect(eq).toHaveBeenCalledWith('epost', 'ny@nova-it.se')
    expect(inviteUserByEmail).toHaveBeenCalledWith('ny@nova-it.se', {
      data: {
        namn: 'Ny Admin',
        full_name: 'Ny Admin',
      },
      redirectTo: 'https://admin.nova-it.se/logga-in?aterstall=1',
    })
    expect(upsert).toHaveBeenCalledWith(
      {
        id: 'user-3',
        epost: 'ny@nova-it.se',
        namn: 'Ny Admin',
        roll: 'administrator',
      },
      { onConflict: 'id' },
    )
  })

  it('skickar inte inbjudan om e-post redan finns i profiles', async () => {
    selectProfiler.mockReturnValueOnce({ eq })
    maybeSingle.mockResolvedValueOnce({ data: { id: 'user-1' }, error: null })

    const resultat = await bjudInPortalProfil({
      epost: 'admin@nova-it.se',
      namn: 'Admin',
      roll: 'medarbetare',
    })

    expect(resultat).toEqual({ ok: false, fel: 'finns_redan' })
    expect(inviteUserByEmail).not.toHaveBeenCalled()
    expect(upsert).not.toHaveBeenCalled()
  })
})

describe('uppdateraProfilNamnIDatabasen', () => {
  it('synkar nytt namn till Supabase Auth metadata och profiles', async () => {
    getUserById.mockResolvedValue({
      data: {
        user: {
          id: 'user-2',
          user_metadata: { tema: 'morkt', namn: 'Gammalt Namn' },
          email_confirmed_at: '2026-07-27T01:00:00.000Z',
          confirmed_at: null,
          last_sign_in_at: '2026-07-28T01:00:00.000Z',
          created_at: '2026-07-27T00:30:00.000Z',
        },
      },
      error: null,
    })
    updateUserById.mockResolvedValue({ data: { user: { id: 'user-2' } }, error: null })
    maybeSingle.mockResolvedValueOnce({
      data: {
        id: 'user-2',
        epost: 'medarbetare@nova-it.se',
        namn: 'Nytt Namn',
        roll: 'medarbetare',
        skapad: '2026-07-27T00:00:00.000Z',
        uppdaterad: '2026-07-28T00:00:00.000Z',
      },
      error: null,
    })

    const profil = await uppdateraProfilNamnIDatabasen('user-2', '  Nytt Namn  ')

    expect(updateUserById).toHaveBeenCalledWith('user-2', {
      user_metadata: {
        tema: 'morkt',
        namn: 'Nytt Namn',
        full_name: 'Nytt Namn',
      },
    })
    expect(update).toHaveBeenCalledWith({ namn: 'Nytt Namn' })
    expect(updateEq).toHaveBeenCalledWith('id', 'user-2')
    expect(profil).toEqual({
      id: 'user-2',
      epost: 'medarbetare@nova-it.se',
      namn: 'Nytt Namn',
      roll: 'medarbetare',
      skapad: '2026-07-27T00:00:00.000Z',
      uppdaterad: '2026-07-28T00:00:00.000Z',
      kontoHalsa: {
        epostBekraftad: true,
        senastInloggad: '2026-07-28T01:00:00.000Z',
        authSkapad: '2026-07-27T00:30:00.000Z',
      },
    })
  })

  it('ändrar inte profiles om Auth metadata inte kan uppdateras', async () => {
    getUserById.mockResolvedValue({
      data: { user: { id: 'user-2', user_metadata: {} } },
      error: null,
    })
    updateUserById.mockResolvedValue({ data: { user: null }, error: new Error('auth nere') })

    const profil = await uppdateraProfilNamnIDatabasen('user-2', 'Nytt Namn')

    expect(profil).toBeNull()
    expect(update).not.toHaveBeenCalled()
  })
})
