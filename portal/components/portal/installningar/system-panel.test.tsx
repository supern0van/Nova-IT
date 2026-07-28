// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Anvandare } from '@/lib/types'

const kan = vi.fn()

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => ({
    anvandare,
    kan,
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

let SystemPanel: typeof import('@/components/portal/installningar/system-panel').SystemPanel

beforeAll(async () => {
  ;({ SystemPanel } = await import('@/components/portal/installningar/system-panel'))
})

const anvandare: Anvandare = {
  id: 'user-admin',
  namn: 'Admin Nova',
  epost: 'admin@nova-it.se',
  roll: 'administrator',
  initialer: 'AN',
  titel: 'Administratör',
  aktiv: true,
}

describe('SystemPanel', () => {
  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
    vi.unstubAllGlobals()
  })

  it('visar inte adminpanel eller hämtar data när klientbehörigheten saknas', () => {
    kan.mockReturnValue(false)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(<SystemPanel />)

    expect(screen.getByText('Systeminställningar visas endast för administratörer.')).toBeTruthy()
    expect(screen.queryByText('Portalkonton')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('visar tydligt nekad-läge om servern nekar adminstatus trots klientbehörighet', async () => {
    kan.mockReturnValue(true)
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ status: 403, ok: false, json: vi.fn() })
        .mockResolvedValueOnce({ status: 403, ok: false, json: vi.fn() }),
    )

    render(<SystemPanel />)

    await waitFor(() => {
      expect(screen.getByText(/Systemstatus visas endast när sessionen är AAL2-verifierad/)).toBeTruthy()
      expect(screen.getByText(/Portalkonton visas endast när sessionen är AAL2-verifierad/)).toBeTruthy()
    })
    expect(fetch).toHaveBeenCalledWith('/api/admin/profiler', expect.any(Object))
    expect(fetch).toHaveBeenCalledWith('/api/admin/systemstatus', expect.any(Object))
  })
})
