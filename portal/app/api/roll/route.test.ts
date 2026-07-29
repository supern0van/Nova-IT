import type { NextRequest } from 'next/server'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

const hamtaAutentiseradAnvandarId = vi.fn()
const hamtaAutentiseradAnvandare = vi.fn()
const hamtaRollFranDatabasen = vi.fn()
const hamtaEgenProfilFranDatabasen = vi.fn()

vi.mock('@/lib/supabase/route-anvandare', () => ({ hamtaAutentiseradAnvandarId, hamtaAutentiseradAnvandare }))
vi.mock('@/lib/auth/roll-server', () => ({ hamtaEgenProfilFranDatabasen, hamtaRollFranDatabasen }))

let GET: typeof import('@/app/api/roll/route').GET

beforeAll(async () => {
  hamtaAutentiseradAnvandare.mockImplementation(async (request: NextRequest) => {
    const id = await hamtaAutentiseradAnvandarId(request)
    return id ? { id, epost: 'test@example.com', demogast: false } : null
  })
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
    expect(hamtaEgenProfilFranDatabasen).not.toHaveBeenCalled()
  })

  it('200 med systemrollen för en giltig, MFA-verifierad administratör', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    hamtaRollFranDatabasen.mockResolvedValue('administrator')
    hamtaEgenProfilFranDatabasen.mockResolvedValue({
      epost: 'webmaster@nova-it.se',
      namn: 'Webmaster',
    })

    const svar = await GET(fakeRequest())

    expect(svar.status).toBe(200)
    expect(await svar.json()).toEqual({
      roll: 'administrator',
      profil: { epost: 'webmaster@nova-it.se', namn: 'Webmaster' },
    })
    expect(hamtaRollFranDatabasen).toHaveBeenCalledWith('user-1')
    expect(hamtaEgenProfilFranDatabasen).toHaveBeenCalledWith('user-1')
  })

  it('200 med systemrollen för en giltig, MFA-verifierad medarbetare', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-2')
    hamtaRollFranDatabasen.mockResolvedValue('medarbetare')
    hamtaEgenProfilFranDatabasen.mockResolvedValue({
      epost: 'medarbetare@nova-it.se',
      namn: 'Medarbetare',
    })

    const svar = await GET(fakeRequest())

    expect(svar.status).toBe(200)
    expect(await svar.json()).toEqual({
      roll: 'medarbetare',
      profil: { epost: 'medarbetare@nova-it.se', namn: 'Medarbetare' },
    })
  })

  it('200 med roll:null om användaren saknar profilrad', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-3')
    hamtaRollFranDatabasen.mockResolvedValue(null)
    hamtaEgenProfilFranDatabasen.mockResolvedValue(null)

    const svar = await GET(fakeRequest())

    expect(svar.status).toBe(200)
    expect(await svar.json()).toEqual({ roll: null, profil: null })
  })

  it('fail-closed vid oväntat fel när systemrollen hämtas', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-1')
    hamtaRollFranDatabasen.mockRejectedValue(new Error('service saknas'))
    hamtaEgenProfilFranDatabasen.mockResolvedValue({
      epost: 'webmaster@nova-it.se',
      namn: 'Webmaster',
    })

    const svar = await GET(fakeRequest())

    expect(svar.status).toBe(500)
    expect(await svar.json()).toEqual({ roll: null, profil: null })
  })
})
