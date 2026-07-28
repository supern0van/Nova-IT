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
const listFactors = vi.fn()
const inviteUserByEmail = vi.fn()
const resetPasswordForEmail = vi.fn()

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
        mfa: {
          listFactors,
        },
        updateUserById,
      },
      resetPasswordForEmail,
    },
  }),
}))

vi.mock('@/lib/auth/roll-server', () => ({
  hamtaRollFranDatabasen: vi.fn(),
}))

let bjudInPortalProfil: typeof import('@/lib/auth/profiler-server').bjudInPortalProfil
let listaProfilerFranDatabasen: typeof import('@/lib/auth/profiler-server').listaProfilerFranDatabasen
let skickaLosenordsaterstallningForProfil: typeof import('@/lib/auth/profiler-server').skickaLosenordsaterstallningForProfil
let uppdateraProfilNamnIDatabasen: typeof import('@/lib/auth/profiler-server').uppdateraProfilNamnIDatabasen
let uppdateraProfilRollIDatabasen: typeof import('@/lib/auth/profiler-server').uppdateraProfilRollIDatabasen

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
  listFactors.mockResolvedValue({ data: { factors: [] }, error: null })
  ;({
    bjudInPortalProfil,
    listaProfilerFranDatabasen,
    skickaLosenordsaterstallningForProfil,
    uppdateraProfilNamnIDatabasen,
    uppdateraProfilRollIDatabasen,
  } = await import('@/lib/auth/profiler-server'))
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
      mfaAntalFaktorer: 0,
      mfaVerifieradeFaktorer: 0,
    })
    expect(listUsers).toHaveBeenCalledWith({ page: 1, perPage: 1000 })
    expect(listFactors).toHaveBeenCalledWith({ userId: 'user-1' })
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

  it('filtrerar bort trasiga profiles-rader innan de skickas till admin-UI:t', async () => {
    order.mockResolvedValue({
      data: [
        {
          id: ' user-1 ',
          epost: ' ADMIN@NOVA-IT.SE ',
          namn: ' Admin ',
          roll: 'administrator',
          skapad: ' 2026-07-27T00:00:00.000Z ',
          uppdaterad: ' 2026-07-27T00:00:00.000Z ',
        },
        {
          id: 'user-trasig',
          epost: 'trasig@nova-it.se',
          namn: 'Trasig',
          roll: 'owner',
          skapad: '2026-07-27T00:00:00.000Z',
          uppdaterad: '2026-07-27T00:00:00.000Z',
        },
      ],
      error: null,
    })
    listUsers.mockResolvedValue({ data: { users: [] }, error: null })

    const profiler = await listaProfilerFranDatabasen()

    expect(profiler).toHaveLength(1)
    expect(profiler[0]).toMatchObject({
      id: 'user-1',
      epost: 'admin@nova-it.se',
      namn: 'Admin',
      roll: 'administrator',
      skapad: '2026-07-27T00:00:00.000Z',
      uppdaterad: '2026-07-27T00:00:00.000Z',
    })
    expect(listFactors).toHaveBeenCalledWith({ userId: 'user-1' })
    expect(listFactors).not.toHaveBeenCalledWith({ userId: 'user-trasig' })
  })

  it('visar verifierad MFA-status när faktorer kan läsas', async () => {
    order.mockResolvedValue({
      data: [
        {
          id: 'user-4',
          epost: 'mfa@nova-it.se',
          namn: 'Mfa Konto',
          roll: 'medarbetare',
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
            id: 'user-4',
            email_confirmed_at: '2026-07-27T01:00:00.000Z',
            confirmed_at: null,
            last_sign_in_at: null,
            created_at: '2026-07-27T00:30:00.000Z',
          },
        ],
      },
      error: null,
    })
    listFactors.mockResolvedValue({
      data: { factors: [{ id: 'faktor-1', status: 'verified' }, { id: 'faktor-2', status: 'unverified' }] },
      error: null,
    })

    const profiler = await listaProfilerFranDatabasen()

    expect(profiler[0]?.kontoHalsa?.mfaAntalFaktorer).toBe(2)
    expect(profiler[0]?.kontoHalsa?.mfaVerifieradeFaktorer).toBe(1)
  })

  it('behåller övriga profiler om MFA-faktorlistning kastar för en enskild rad', async () => {
    order.mockResolvedValue({
      data: [
        {
          id: 'user-ok',
          epost: 'ok@nova-it.se',
          namn: 'Ok Konto',
          roll: 'administrator',
          skapad: '2026-07-27T00:00:00.000Z',
          uppdaterad: '2026-07-27T00:00:00.000Z',
        },
        {
          id: 'user-fel',
          epost: 'fel@nova-it.se',
          namn: 'Fel Konto',
          roll: 'medarbetare',
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
            id: 'user-ok',
            email_confirmed_at: '2026-07-27T01:00:00.000Z',
            confirmed_at: null,
            last_sign_in_at: null,
            created_at: '2026-07-27T00:30:00.000Z',
          },
          {
            id: 'user-fel',
            email_confirmed_at: '2026-07-27T01:00:00.000Z',
            confirmed_at: null,
            last_sign_in_at: null,
            created_at: '2026-07-27T00:30:00.000Z',
          },
        ],
      },
      error: null,
    })
    listFactors.mockImplementation(({ userId }: { userId: string }) => {
      if (userId === 'user-fel') throw new Error('mfa nere')
      return Promise.resolve({ data: { factors: [{ id: 'faktor-1', status: 'verified' }] }, error: null })
    })

    const profiler = await listaProfilerFranDatabasen()

    expect(profiler).toHaveLength(2)
    expect(profiler.find((profil) => profil.id === 'user-ok')?.kontoHalsa).toMatchObject({
      mfaAntalFaktorer: 1,
      mfaVerifieradeFaktorer: 1,
    })
    expect(profiler.find((profil) => profil.id === 'user-fel')?.kontoHalsa).toMatchObject({
      mfaAntalFaktorer: null,
      mfaVerifieradeFaktorer: null,
    })
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
          mfaAntalFaktorer: null,
          mfaVerifieradeFaktorer: null,
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

  it('returnerar kunde_inte_spara_profil om profiles-kontrollen kastar vid inbjudan', async () => {
    selectProfiler.mockReturnValueOnce({ eq })
    maybeSingle.mockRejectedValueOnce(new Error('profiles timeout'))

    const resultat = await bjudInPortalProfil({
      epost: 'ny@nova-it.se',
      namn: 'Ny Admin',
      roll: 'administrator',
    })

    expect(resultat).toEqual({ ok: false, fel: 'kunde_inte_spara_profil' })
    expect(inviteUserByEmail).not.toHaveBeenCalled()
  })

  it('returnerar kunde_inte_spara_profil om profiles-upsert kastar efter inbjudan', async () => {
    selectProfiler.mockReturnValueOnce({ eq })
    maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockRejectedValueOnce(new Error('upsert timeout'))
    inviteUserByEmail.mockResolvedValue({
      data: { user: { id: 'user-3' } },
      error: null,
    })

    const resultat = await bjudInPortalProfil({
      epost: 'ny@nova-it.se',
      namn: 'Ny Admin',
      roll: 'administrator',
    })

    expect(resultat).toEqual({ ok: false, fel: 'kunde_inte_spara_profil' })
  })

  it('nekar ogiltiga inbjudningsvärden innan Supabase anropas', async () => {
    const resultat = await bjudInPortalProfil({
      epost: 'inte-epost',
      namn: 'A',
      roll: 'medarbetare',
    })

    expect(resultat).toEqual({ ok: false, fel: 'kunde_inte_spara_profil' })
    expect(selectProfiler).not.toHaveBeenCalled()
    expect(inviteUserByEmail).not.toHaveBeenCalled()
    expect(upsert).not.toHaveBeenCalled()
  })
})

describe('uppdateraProfilRollIDatabasen', () => {
  it('nekar tomt profil-id innan databasen anropas', async () => {
    const profil = await uppdateraProfilRollIDatabasen('   ', 'medarbetare')

    expect(profil).toBeNull()
    expect(update).not.toHaveBeenCalled()
  })

  it('returnerar null om rolluppdateringen kastar', async () => {
    maybeSingle.mockRejectedValue(new Error('profiles timeout'))

    const profil = await uppdateraProfilRollIDatabasen('user-2', 'medarbetare')

    expect(profil).toBeNull()
  })
})

describe('uppdateraProfilNamnIDatabasen', () => {
  it('nekar ogiltigt namn innan Auth Admin anropas', async () => {
    const profil = await uppdateraProfilNamnIDatabasen('user-2', 'A')

    expect(profil).toBeNull()
    expect(getUserById).not.toHaveBeenCalled()
    expect(updateUserById).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })

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
        mfaAntalFaktorer: null,
        mfaVerifieradeFaktorer: null,
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

  it('returnerar null om Auth Admin-kontot kastar vid namnuppdatering', async () => {
    getUserById.mockRejectedValue(new Error('auth timeout'))

    const profil = await uppdateraProfilNamnIDatabasen('user-2', 'Nytt Namn')

    expect(profil).toBeNull()
    expect(updateUserById).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })

  it('returnerar null om profiles-uppdateringen kastar efter Auth metadata', async () => {
    getUserById.mockResolvedValue({
      data: { user: { id: 'user-2', user_metadata: {} } },
      error: null,
    })
    updateUserById.mockResolvedValue({ data: { user: { id: 'user-2' } }, error: null })
    maybeSingle.mockRejectedValue(new Error('profiles timeout'))

    const profil = await uppdateraProfilNamnIDatabasen('user-2', 'Nytt Namn')

    expect(profil).toBeNull()
  })

  it('returnerar null om profiles svarar med ogiltig roll efter namnuppdatering', async () => {
    getUserById.mockResolvedValue({
      data: {
        user: {
          id: 'user-2',
          user_metadata: {},
          email_confirmed_at: null,
          confirmed_at: null,
          last_sign_in_at: null,
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
        roll: 'owner',
        skapad: '2026-07-27T00:00:00.000Z',
        uppdaterad: '2026-07-28T00:00:00.000Z',
      },
      error: null,
    })

    await expect(uppdateraProfilNamnIDatabasen('user-2', 'Nytt Namn')).resolves.toBeNull()
  })
})

describe('skickaLosenordsaterstallningForProfil', () => {
  it('skickar Supabase lösenordsåterställning till profilens e-postadress', async () => {
    selectProfiler.mockReturnValueOnce({ eq })
    maybeSingle.mockResolvedValueOnce({
      data: { epost: 'MEDARBETARE@NOVA-IT.SE' },
      error: null,
    })
    resetPasswordForEmail.mockResolvedValue({ data: {}, error: null })

    const resultat = await skickaLosenordsaterstallningForProfil(
      'user-2',
      'https://admin.nova-it.se/logga-in?aterstall=1',
    )

    expect(resultat).toEqual({ ok: true, epost: 'medarbetare@nova-it.se' })
    expect(eq).toHaveBeenCalledWith('id', 'user-2')
    expect(resetPasswordForEmail).toHaveBeenCalledWith('medarbetare@nova-it.se', {
      redirectTo: 'https://admin.nova-it.se/logga-in?aterstall=1',
    })
  })

  it('returnerar profil_saknas om profilen inte kan läsas', async () => {
    selectProfiler.mockReturnValueOnce({ eq })
    maybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const resultat = await skickaLosenordsaterstallningForProfil(
      'user-saknas',
      'https://admin.nova-it.se/logga-in?aterstall=1',
    )

    expect(resultat).toEqual({ ok: false, fel: 'profil_saknas' })
    expect(resetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('returnerar kunde_inte_skicka om Supabase-lösenordsanropet kastar', async () => {
    selectProfiler.mockReturnValueOnce({ eq })
    maybeSingle.mockResolvedValueOnce({
      data: { epost: 'medarbetare@nova-it.se' },
      error: null,
    })
    resetPasswordForEmail.mockRejectedValue(new Error('auth timeout'))

    const resultat = await skickaLosenordsaterstallningForProfil(
      'user-2',
      'https://admin.nova-it.se/logga-in?aterstall=1',
    )

    expect(resultat).toEqual({ ok: false, fel: 'kunde_inte_skicka' })
  })

  it('nekar osäker redirect-url innan Supabase anropas', async () => {
    const resultat = await skickaLosenordsaterstallningForProfil('user-2', 'http://admin.nova-it.se/logga-in')

    expect(resultat).toEqual({ ok: false, fel: 'profil_saknas' })
    expect(selectProfiler).not.toHaveBeenCalled()
    expect(resetPasswordForEmail).not.toHaveBeenCalled()
  })
})
