// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Anvandare } from '@/lib/types'

const replace = vi.fn()
const useAuth = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}))

vi.mock('@/components/auth/auth-provider', () => ({ useAuth }))

let SkyddadRoute: typeof import('@/components/auth/skyddad-route').SkyddadRoute

beforeAll(async () => {
  ;({ SkyddadRoute } = await import('@/components/auth/skyddad-route'))
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

describe('SkyddadRoute', () => {
  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('visar laddningsläge och inte admininnehåll när systemrollen ännu inte ger behörighet', async () => {
    useAuth.mockReturnValue({
      anvandare,
      initierar: false,
      laddarRoll: false,
      kan: vi.fn(() => false),
    })

    render(
      <SkyddadRoute kraverBehorighet="se_installningar">
        <div>Hemligt admininnehåll</div>
      </SkyddadRoute>,
    )

    expect(screen.getByText('Läser in portalen…')).toBeTruthy()
    expect(screen.queryByText('Hemligt admininnehåll')).toBeNull()
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/portal'))
  })

  it('renderar barn först när behörigheten är godkänd', () => {
    useAuth.mockReturnValue({
      anvandare,
      initierar: false,
      laddarRoll: false,
      kan: vi.fn(() => true),
    })

    render(
      <SkyddadRoute kraverBehorighet="se_installningar">
        <div>Hemligt admininnehåll</div>
      </SkyddadRoute>,
    )

    expect(screen.getByText('Hemligt admininnehåll')).toBeTruthy()
  })
})
