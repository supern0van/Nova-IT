import { beforeEach, describe, expect, it, vi } from 'vitest'

const selectProfiler = vi.fn()
const order = vi.fn()
const listUsers = vi.fn()

vi.mock('@/lib/supabase/service', () => ({
  skapaSupabaseServiceklient: () => ({
    from: () => ({
      select: selectProfiler,
    }),
    auth: {
      admin: {
        listUsers,
      },
    },
  }),
}))

vi.mock('@/lib/auth/roll-server', () => ({
  hamtaRollFranDatabasen: vi.fn(),
}))

let listaProfilerFranDatabasen: typeof import('@/lib/auth/profiler-server').listaProfilerFranDatabasen

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  selectProfiler.mockReturnValue({ order })
  ;({ listaProfilerFranDatabasen } = await import('@/lib/auth/profiler-server'))
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
