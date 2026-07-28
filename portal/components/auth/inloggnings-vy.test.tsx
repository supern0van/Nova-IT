// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Anvandare } from '@/lib/types'

const replace = vi.fn()
let sokParametrar = new URLSearchParams()
let authState: {
  anvandare: Anvandare | null
  initierar: boolean
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => sokParametrar,
}))

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => ({
    ...authState,
    loggaIn: vi.fn(),
    loggarIn: false,
    sessionUtgick: false,
    rensaSessionUtgick: vi.fn(),
  }),
}))

let InloggningsVy: typeof import('@/components/auth/inloggnings-vy').InloggningsVy

const admin: Anvandare = {
  id: 'user-admin',
  namn: 'Admin Nova',
  epost: 'admin@nova-it.se',
  roll: 'administrator',
  initialer: 'AN',
  titel: 'Administratör',
  aktiv: true,
}

beforeAll(async () => {
  ;({ InloggningsVy } = await import('@/components/auth/inloggnings-vy'))
})

describe('InloggningsVy redirect-skydd', () => {
  afterEach(() => {
    cleanup()
    replace.mockClear()
    sokParametrar = new URLSearchParams()
    authState = {
      anvandare: null,
      initierar: false,
    }
  })

  it('skickar redan inloggad användare till en intern next-sökväg', async () => {
    authState = { anvandare: admin, initierar: false }
    sokParametrar = new URLSearchParams({ next: '/portal/installningar' })

    render(<InloggningsVy />)

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/portal/installningar')
    })
  })

  it('faller tillbaka till /portal om next pekar utanför portalen', async () => {
    authState = { anvandare: admin, initierar: false }
    sokParametrar = new URLSearchParams({ next: 'https://evil.example/portal' })

    render(<InloggningsVy />)

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/portal')
    })
  })

  it('redirectar inte bort en recovery-session innan nytt lösenord hanterats', () => {
    authState = { anvandare: admin, initierar: false }
    sokParametrar = new URLSearchParams({ aterstall: '1', next: '/portal/installningar' })

    render(<InloggningsVy />)

    expect(screen.getByText('Välj nytt lösenord')).toBeTruthy()
    expect(replace).not.toHaveBeenCalled()
  })
})
