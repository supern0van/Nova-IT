// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Anvandare } from '@/lib/types'

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

const session = {
  anvandareId: 'user-1',
  upphorVid: Date.now() + 60_000,
}

function Probe() {
  const { roll, laddarRoll } = useAuth()
  return (
    <div>
      <span data-testid="roll">{roll ?? 'ingen-roll'}</span>
      <span data-testid="laddar-roll">{laddarRoll ? 'laddar' : 'klar'}</span>
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
})
