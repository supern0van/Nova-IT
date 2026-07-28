import type { NextRequest } from 'next/server'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

const getClaims = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getClaims },
  })),
}))

// Miljövariablerna måste finnas innan modulen importeras (läses vid anropstillfället, inte modulladdning – men sätts ändå här för tydlighets skull).
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key'

let hamtaAutentiseradAnvandarId: typeof import('@/lib/supabase/route-anvandare').hamtaAutentiseradAnvandarId

beforeAll(async () => {
  ;({ hamtaAutentiseradAnvandarId } = await import('@/lib/supabase/route-anvandare'))
})

function fakeRequest(): NextRequest {
  return { cookies: { getAll: () => [] } } as unknown as NextRequest
}

describe('hamtaAutentiseradAnvandarId (skydd för protected server functions, t.ex. /api/roll)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('blockerad åtkomst: ingen session ger null', async () => {
    getClaims.mockResolvedValue({ data: { claims: null } })
    const id = await hamtaAutentiseradAnvandarId(fakeRequest())
    expect(id).toBeNull()
  })

  it('blockerad åtkomst före MFA: inloggad men aal1 ger null', async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: 'user-1', aal: 'aal1' } } })
    const id = await hamtaAutentiseradAnvandarId(fakeRequest())
    expect(id).toBeNull()
  })

  it('tillåten åtkomst efter MFA: inloggad och aal2 ger användar-id', async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: 'user-1', aal: 'aal2' } } })
    const id = await hamtaAutentiseradAnvandarId(fakeRequest())
    expect(id).toBe('user-1')
  })

  it('saknat aal-claim faller stängt (behandlas som aal1)', async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: 'user-1' } } })
    const id = await hamtaAutentiseradAnvandarId(fakeRequest())
    expect(id).toBeNull()
  })

  it('saknat eller tomt sub-claim ger null även efter aal2', async () => {
    getClaims.mockResolvedValueOnce({ data: { claims: { aal: 'aal2' } } })
    await expect(hamtaAutentiseradAnvandarId(fakeRequest())).resolves.toBeNull()

    getClaims.mockResolvedValueOnce({ data: { claims: { sub: '   ', aal: 'aal2' } } })
    await expect(hamtaAutentiseradAnvandarId(fakeRequest())).resolves.toBeNull()
  })

  it('fail-closed om Supabase getClaims kastar', async () => {
    getClaims.mockRejectedValue(new Error('jwt nere'))

    await expect(hamtaAutentiseradAnvandarId(fakeRequest())).resolves.toBeNull()
  })
})
