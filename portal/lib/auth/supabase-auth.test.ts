import { beforeEach, describe, expect, it, vi } from 'vitest'

const signInWithPassword = vi.fn()
const getSession = vi.fn()
const signOut = vi.fn()
const onAuthStateChange = vi.fn()
const resetPasswordForEmail = vi.fn()
const updateUser = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  skapaSupabaseWebblasarklient: () => ({
    auth: {
      signInWithPassword,
      getSession,
      signOut,
      onAuthStateChange,
      resetPasswordForEmail,
      updateUser,
    },
  }),
}))

let authAdapter: typeof import('@/lib/auth/supabase-auth').authAdapter

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  ;({ authAdapter } = await import('@/lib/auth/supabase-auth'))
})

describe('authAdapter Supabase-identitet', () => {
  it('nekar inloggning utan e-post eller lösenord innan Supabase anropas', async () => {
    await expect(authAdapter.loggaIn('', 'hemligt', false)).resolves.toEqual({
      ok: false,
      fel: 'saknade_uppgifter',
    })
    await expect(authAdapter.loggaIn('admin@nova-it.se', '', false)).resolves.toEqual({
      ok: false,
      fel: 'saknade_uppgifter',
    })
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('nekar ogiltig e-post innan Supabase anropas', async () => {
    await expect(authAdapter.loggaIn('inte-epost', 'hemligt', false)).resolves.toEqual({
      ok: false,
      fel: 'ogiltig_epost',
    })

    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('returnerar fel_uppgifter när Supabase nekar inloggningen', async () => {
    signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: new Error('invalid credentials'),
    })

    await expect(authAdapter.loggaIn('Admin@Nova-IT.se', 'fel-losenord', true)).resolves.toEqual({
      ok: false,
      fel: 'fel_uppgifter',
    })
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@nova-it.se',
      password: 'fel-losenord',
    })
  })

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

  it('skickar återställningslänk via Supabase Auth', async () => {
    resetPasswordForEmail.mockResolvedValue({ error: null })

    const resultat = await authAdapter.begarAterstallning('Admin@Nova-IT.se')

    expect(resultat).toEqual({ ok: true })
    expect(resetPasswordForEmail).toHaveBeenCalledWith('admin@nova-it.se', {
      redirectTo: undefined,
    })
  })

  it('uppdaterar lösenord via Supabase Auth och loggar ut recovery-sessionen', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('') }),
    )
    updateUser.mockResolvedValue({ error: null })
    signOut.mockResolvedValue({ error: null })

    const resultat = await authAdapter.uppdateraLosenord('nytt-losenord')

    expect(resultat).toEqual({ ok: true })
    expect(updateUser).toHaveBeenCalledWith({ password: 'nytt-losenord' })
    expect(signOut).toHaveBeenCalled()

    vi.unstubAllGlobals()
  })

  describe('läckt lösenord (Have I Been Pwned, k-Anonymity)', () => {
    async function sha1Hex(varde: string): Promise<string> {
      const data = new TextEncoder().encode(varde)
      const hashBuffer = await crypto.subtle.digest('SHA-1', data)
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
    }

    it('nekar ett lösenord som finns med i HIBP-svaret, utan att anropa Supabase', async () => {
      const hash = await sha1Hex('lackt-losenord-123')
      const suffix = hash.slice(5)
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          text: () => Promise.resolve(`${suffix}:42\r\nAAAAAAAAAAAAAAAAAAAAAAAAAAA:1`),
        }),
      )

      const resultat = await authAdapter.uppdateraLosenord('lackt-losenord-123')

      expect(resultat).toEqual({ ok: false, fel: 'lackt_losenord' })
      expect(updateUser).not.toHaveBeenCalled()

      vi.unstubAllGlobals()
    })

    it('tillåter ett lösenord som inte finns med i HIBP-svaret', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          text: () => Promise.resolve('AAAAAAAAAAAAAAAAAAAAAAAAAAA:1'),
        }),
      )
      updateUser.mockResolvedValue({ error: null })
      signOut.mockResolvedValue({ error: null })

      const resultat = await authAdapter.uppdateraLosenord('ett-ovanligt-losenord-xyz')

      expect(resultat).toEqual({ ok: true })
      expect(updateUser).toHaveBeenCalled()

      vi.unstubAllGlobals()
    })

    it('faller fail-open (blockerar inte) om HIBP-anropet misslyckas', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('nätverksfel')))
      updateUser.mockResolvedValue({ error: null })
      signOut.mockResolvedValue({ error: null })

      const resultat = await authAdapter.uppdateraLosenord('ett-ovanligt-losenord-xyz')

      expect(resultat).toEqual({ ok: true })
      expect(updateUser).toHaveBeenCalled()

      vi.unstubAllGlobals()
    })

    it('faller fail-open om HIBP svarar med ett icke-OK-status', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, text: () => Promise.resolve('') }),
      )
      updateUser.mockResolvedValue({ error: null })
      signOut.mockResolvedValue({ error: null })

      const resultat = await authAdapter.uppdateraLosenord('ett-ovanligt-losenord-xyz')

      expect(resultat).toEqual({ ok: true })
      expect(updateUser).toHaveBeenCalled()

      vi.unstubAllGlobals()
    })
  })
})
