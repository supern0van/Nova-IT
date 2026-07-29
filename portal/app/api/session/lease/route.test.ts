import { beforeEach, describe, expect, it, vi } from 'vitest'

const { hamtaAutentiseradAnvandarId, hamtaAutentiseradAnvandare } = vi.hoisted(() => ({
  hamtaAutentiseradAnvandarId: vi.fn(),
  hamtaAutentiseradAnvandare: vi.fn(),
}))

vi.mock('@/lib/supabase/route-anvandare', () => ({ hamtaAutentiseradAnvandarId, hamtaAutentiseradAnvandare }))

import { POST } from './route'

beforeEach(() => {
  hamtaAutentiseradAnvandare.mockImplementation(async (request: Request) => {
    const id = await hamtaAutentiseradAnvandarId(request)
    return id ? { id, epost: 'test@example.com', demogast: false } : null
  })
})

describe('POST /api/session/lease', () => {
  it('kräver en verifierad AAL2-session', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValueOnce(null)
    const svar = await POST(new Request('https://admin.nova-it.se/api/session/lease') as never)
    expect(svar.status).toBe(401)
  })

  it('accepterar aktivitet från en verifierad användare', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValueOnce('user-1')
    const svar = await POST(new Request('https://admin.nova-it.se/api/session/lease') as never)
    expect(svar.status).toBe(204)
  })
})
