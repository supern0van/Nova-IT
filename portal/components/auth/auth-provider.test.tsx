// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Session } from '@/lib/auth/supabase-auth'
import type { Anvandare } from '@/lib/types'
import { INAKTIVITETS_TIMEOUT_MS, SENAST_AKTIV_NYCKEL } from '@/lib/auth/session-timeouts'

const replace = vi.fn()
const hamtaSession = vi.fn()
const lyssnaPaSessionsandringar = vi.fn()
const loggaIn = vi.fn()
const loggaUt = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}))

vi.mock('@/lib/auth/supabase-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/supabase-auth')>()
  return {
    ...actual,
    authAdapter: {
      hamtaSession,
      lyssnaPaSessionsandringar,
      loggaIn,
      loggaUt,
    },
  }
})

let AuthProvider: typeof import('@/components/auth/auth-provider').AuthProvider
let useAuth: typeof import('@/components/auth/auth-provider').useAuth

beforeAll(async () => {
  ;({ AuthProvider, useAuth } = await import('@/components/auth/auth-provider'))
})

const anvandare: Anvandare = {
  id: 'user-1',
  namn: 'Admin Nova',
  epost: 'admin@nova-it.se',
  roll: 'administrator',
  initialer: 'AN',
  titel: 'Administratör',
  aktiv: true,
}

const session: Session = {
  anvandareId: 'user-1',
  epost: 'admin@nova-it.se',
  roll: 'administrator',
  upphorVid: Date.now() + 60_000,
  ihagkommen: false,
}

function Probe() {
  const { anvandare, roll, laddarRoll, sessionUtgick, kan, loggaUt } = useAuth()
  return (
    <div>
      <span data-testid="anvandare">{anvandare?.id ?? 'ingen-anvandare'}</span>
      <span data-testid="roll">{roll ?? 'ingen-roll'}</span>
      <span data-testid="laddar-roll">{laddarRoll ? 'laddar' : 'klar'}</span>
      <span data-testid="session-utgick">{sessionUtgick ? 'utgången' : 'aktiv'}</span>
      <span data-testid="kan-hantera-anvandare">
        {kan('hantera_anvandare') ? 'tillaten' : 'nekad'}
      </span>
      <button type="button" onClick={() => void loggaUt()}>
        Logga ut
      </button>
    </div>
  )
}

function renderaProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )
}

describe('AuthProvider – systemroll från /api/roll', () => {
  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
    vi.unstubAllGlobals()
    window.sessionStorage.clear()
    vi.useRealTimers()
  })

  it('fail-closed till roll=null vid nätverksfel', async () => {
    hamtaSession.mockResolvedValue({ session, anvandare })
    lyssnaPaSessionsandringar.mockReturnValue(vi.fn())
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('nätverk nere')))

    renderaProvider()

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/roll')
      expect(screen.getByTestId('laddar-roll').textContent).toBe('klar')
    })
    expect(screen.getByTestId('roll').textContent).toBe('ingen-roll')
    expect(screen.getByTestId('kan-hantera-anvandare').textContent).toBe('nekad')
  })

  it('fail-closed till roll=null när /api/roll svarar icke-ok', async () => {
    hamtaSession.mockResolvedValue({ session, anvandare })
    lyssnaPaSessionsandringar.mockReturnValue(vi.fn())
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn(),
      }),
    )

    renderaProvider()

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/roll')
      expect(screen.getByTestId('laddar-roll').textContent).toBe('klar')
    })
    expect(screen.getByTestId('roll').textContent).toBe('ingen-roll')
  })

  it('fail-closed till roll=null när /api/roll returnerar en okänd roll', async () => {
    hamtaSession.mockResolvedValue({ session, anvandare })
    lyssnaPaSessionsandringar.mockReturnValue(vi.fn())
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ roll: 'superadmin' }),
      }),
    )

    renderaProvider()

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/roll')
      expect(screen.getByTestId('laddar-roll').textContent).toBe('klar')
    })
    expect(screen.getByTestId('roll').textContent).toBe('ingen-roll')
  })

  it('fail-closed till roll=null när /api/roll inte kan tolkas som JSON', async () => {
    hamtaSession.mockResolvedValue({ session, anvandare })
    lyssnaPaSessionsandringar.mockReturnValue(vi.fn())
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('trasig json')),
      }),
    )

    renderaProvider()

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/roll')
      expect(screen.getByTestId('laddar-roll').textContent).toBe('klar')
    })
    expect(screen.getByTestId('roll').textContent).toBe('ingen-roll')
  })

  it('loggar ut lokalt och markerar sessionen som utgången när token-tiden passerat', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-28T12:00:00.000Z'))
    hamtaSession.mockResolvedValue({
      session: {
        ...session,
        upphorVid: new Date('2026-07-28T12:00:10.000Z').getTime(),
      },
      anvandare,
    })
    lyssnaPaSessionsandringar.mockReturnValue(vi.fn())
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ roll: 'administrator' }),
      }),
    )

    renderaProvider()

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(screen.getByTestId('anvandare').textContent).toBe('user-1')

    await act(async () => {
      vi.setSystemTime(new Date('2026-07-28T12:00:31.000Z'))
      vi.advanceTimersByTime(30_000)
    })

    expect(screen.getByTestId('anvandare').textContent).toBe('ingen-anvandare')
    expect(screen.getByTestId('session-utgick').textContent).toBe('utgången')
    expect(replace).toHaveBeenCalledWith('/logga-in')
  })

  it('loggar ut efter inaktivitet även om Supabase-token fortfarande förnyas', async () => {
    vi.useFakeTimers()
    const start = new Date('2026-07-28T12:00:00.000Z')
    vi.setSystemTime(start)
    window.sessionStorage.setItem(SENAST_AKTIV_NYCKEL, String(start.getTime()))
    hamtaSession.mockResolvedValue({ session, anvandare })
    lyssnaPaSessionsandringar.mockReturnValue(vi.fn())
    loggaUt.mockResolvedValue({ ok: true })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ roll: 'administrator' }),
      }),
    )

    renderaProvider()

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(screen.getByTestId('anvandare').textContent).toBe('user-1')

    await act(async () => {
      vi.advanceTimersByTime(INAKTIVITETS_TIMEOUT_MS + 15_000)
      await Promise.resolve()
    })

    expect(loggaUt).toHaveBeenCalled()
    expect(screen.getByTestId('anvandare').textContent).toBe('ingen-anvandare')
    expect(screen.getByTestId('session-utgick').textContent).toBe('utgången')
    expect(replace).toHaveBeenCalledWith('/logga-in')
  })

  it('hämtar om rollen direkt när Supabase bekräftar MFA-utmaningen', async () => {
    let sessionsCallback:
      | Parameters<typeof import('@/lib/auth/supabase-auth').authAdapter.lyssnaPaSessionsandringar>[0]
      | null = null
    hamtaSession.mockResolvedValue({ session, anvandare })
    lyssnaPaSessionsandringar.mockImplementation((callback) => {
      sessionsCallback = callback
      return vi.fn()
    })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          json: vi.fn(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ roll: 'administrator' }),
        }),
    )

    renderaProvider()

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('roll').textContent).toBe('ingen-roll')
    })

    await act(async () => {
      sessionsCallback?.({ session, anvandare }, 'MFA_CHALLENGE_VERIFIED')
    })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(screen.getByTestId('roll').textContent).toBe('administrator')
    })
  })

  it('behåller sessionen lokalt om Supabase-utloggningen misslyckas', async () => {
    hamtaSession.mockResolvedValue({ session, anvandare })
    lyssnaPaSessionsandringar.mockReturnValue(vi.fn())
    loggaUt.mockResolvedValue({ ok: false })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ roll: 'administrator' }),
      }),
    )

    renderaProvider()

    await waitFor(() => {
      expect(screen.getByTestId('anvandare').textContent).toBe('user-1')
      expect(screen.getByTestId('roll').textContent).toBe('administrator')
    })

    await act(async () => {
      screen.getByRole('button', { name: 'Logga ut' }).click()
    })

    await waitFor(() => {
      expect(loggaUt).toHaveBeenCalled()
    })
    expect(screen.getByTestId('anvandare').textContent).toBe('user-1')
    expect(screen.getByTestId('roll').textContent).toBe('administrator')
    expect(replace).not.toHaveBeenCalled()
  })

  it('rensar lokal session och redirectar när Supabase-utloggningen lyckas', async () => {
    hamtaSession.mockResolvedValue({ session, anvandare })
    lyssnaPaSessionsandringar.mockReturnValue(vi.fn())
    loggaUt.mockResolvedValue({ ok: true })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ roll: 'administrator' }),
      }),
    )

    renderaProvider()

    await waitFor(() => {
      expect(screen.getByTestId('anvandare').textContent).toBe('user-1')
      expect(screen.getByTestId('roll').textContent).toBe('administrator')
    })

    await act(async () => {
      screen.getByRole('button', { name: 'Logga ut' }).click()
    })

    await waitFor(() => {
      expect(loggaUt).toHaveBeenCalled()
      expect(screen.getByTestId('anvandare').textContent).toBe('ingen-anvandare')
    })
    expect(screen.getByTestId('roll').textContent).toBe('ingen-roll')
    expect(screen.getByTestId('session-utgick').textContent).toBe('aktiv')
    expect(replace).toHaveBeenCalledWith('/logga-in')
  })
})
