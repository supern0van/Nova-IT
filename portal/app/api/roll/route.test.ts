import type { NextRequest } from 'next/server'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

const hamtaAutentiseradAnvandarId = vi.fn()
const hamtaRollFranDatabasen = vi.fn()

vi.mock('@/lib/supabase/route-anvandare', () => ({ hamtaAutentiseradAnvandarId }))
vi.mock('@/lib/auth/roll-server', () => ({ hamtaRollFranDatabasen }))

let GET: typeof import('@/app/api/roll/route').GET

beforeAll(async () => {
  ;({ GET } = await import('@/app/api/roll/route'))
})

function fakeRequest(): NextRequest {
  return {} as unknown as NextRequest
}

/**
 * `/api/roll` (systemrollslogiken) ska fortsätta fungera precis som innan
 * steg 4 – MEN kravet "ingen åtkomst till skyddade serverfunktioner innan
 * MFA är verifierad" uppfylls redan av `hamtaAutentiseradAnvandarId()`
 * (testad separat i `lib/supabase/route-anvandare.test.ts`), så den här
 * route-handlern behöver inte veta något om MFA/AAL alls – den litar bara
 * på att helpern redan nekat icke-MFA-verifierade anrop.
 */
describe('GET /api/roll', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('401 utan giltig, MFA-verifierad session (helpern returnerar null)', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue(null)

    const svar = await GET(fakeRequest())

    expect(svar.status).toBe(401)
    expect(await svar.json()).toEqual({ roll: null })
    expect(hamtaRollFranDatabasen).not.toHaveBeenCalled()
  })

  it('200 med systemrollen för en giltig, MFA-verifierad administratör', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    hamtaRollFranDatabasen.mockResolvedValue('administrator')

    const svar = await GET(fakeRequest())

    expect(svar.status).toBe(200)
    expect(await svar.json()).toEqual({ roll: 'administrator' })
    expect(hamtaRollFranDatabasen).toHaveBeenCalledWith('user-1')
  })

  it('200 med systemrollen för en giltig, MFA-verifierad medarbetare', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-2')
    hamtaRollFranDatabasen.mockResolvedValue('medarbetare')

    const svar = await GET(fakeRequest())

    expect(svar.status).toBe(200)
    expect(await svar.json()).toEqual({ roll: 'medarbetare' })
  })

  it('200 med roll:null om användaren saknar profilrad', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-3')
    hamtaRollFranDatabasen.mockResolvedValue(null)

    const svar = await GET(fakeRequest())

    expect(svar.status).toBe(200)
    expect(await svar.json()).toEqual({ roll: null })
  })
})
