import { beforeEach, describe, expect, it, vi } from 'vitest'

const signInWithPassword = vi.fn()
const getSession = vi.fn()
const signOut = vi.fn()
const onAuthStateChange = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  skapaSupabaseWebblasarklient: () => ({
    auth: {
      signInWithPassword,
      getSession,
      signOut,
      onAuthStateChange,
    },
  }),
}))

let authAdapter: typeof import('@/lib/auth/demo-auth').authAdapter

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  ;({ authAdapter } = await import('@/lib/auth/demo-auth'))
})

describe('authAdapter Supabase-identitet', () => {
  it('bygger portalens användarvisning från Supabase user_metadata i stället för demopersonal', async () => {
    signInWithPassword.mockResolvedValue({
      data: {
        session: { expires_at: 1_800_000_000 },
        user: {
          id: 'supabase-user-1',
          email: 'admin@nova-it.se',
          user_metadata: {
            full_name: 'Riktig Admin',
            title: 'Driftansvarig',
          },
        },
      },
      error: null,
    })

    const resultat = await authAdapter.loggaIn('admin@nova-it.se', 'hemligt', false)

    expect(resultat.ok).toBe(true)
    if (!resultat.ok) return
    expect(resultat.anvandare).toMatchObject({
      id: 'supabase-user-1',
      epost: 'admin@nova-it.se',
      namn: 'Riktig Admin',
      titel: 'Driftansvarig',
      initialer: 'RA',
    })
  })

  it('härleder namn från e-post om Supabase saknar metadata', async () => {
    getSession.mockResolvedValue({
      data: {
        session: {
          expires_at: 1_800_000_000,
          user: {
            id: 'supabase-user-2',
            email: 'webmaster@nova-it.se',
            user_metadata: {},
          },
        },
      },
    })

    const resultat = await authAdapter.hamtaSession()

    expect(resultat?.anvandare).toMatchObject({
      id: 'supabase-user-2',
      epost: 'webmaster@nova-it.se',
      namn: 'webmaster',
      titel: 'Adminkonto (tillfällig personalmappning)',
      initialer: 'W',
    })
  })
})
