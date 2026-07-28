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

  it('visar felläge om initial adminstatus inte kan hämtas', async () => {
    kan.mockReturnValue(true)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('worker nere')))

    render(<SystemPanel />)

    await waitFor(() => {
      expect(screen.getByText(/Systemstatus kunde inte hämtas just nu/)).toBeTruthy()
      expect(screen.getByText(/Portalkontona kunde inte läsas just nu/)).toBeTruthy()
    })
  })

  it('låser egen systemroll och egen MFA-återställning i admin-UI:t', async () => {
    kan.mockReturnValue(true)
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: vi.fn().mockResolvedValue({
            profiler: [
              {
                id: 'user-admin',
                epost: 'admin@nova-it.se',
                namn: 'Admin Nova',
                roll: 'administrator',
                skapad: '2026-07-27T00:00:00.000Z',
                uppdaterad: '2026-07-28T00:00:00.000Z',
                kontoHalsa: {
                  epostBekraftad: true,
                  senastInloggad: null,
                  authSkapad: '2026-07-27T00:00:00.000Z',
                  mfaAntalFaktorer: 1,
                  mfaVerifieradeFaktorer: 1,
                },
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: vi.fn().mockResolvedValue({
            status: {
              kontroller: [],
              profiler: { antal: 1, status: 'ok' },
            },
          }),
        }),
    )

    render(<SystemPanel />)

    await waitFor(() => {
      expect(screen.getByText('admin@nova-it.se')).toBeTruthy()
    })

    expect(screen.getByText('Din egen roll ändras inte här.')).toBeTruthy()
    expect(
      (screen.getByLabelText('Ändra systemroll för admin@nova-it.se') as HTMLButtonElement).disabled,
    ).toBe(true)
    expect((screen.getByRole('button', { name: 'Återställ' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
  })
})
