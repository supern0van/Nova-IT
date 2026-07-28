import type { NextRequest } from 'next/server'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

const hamtaAutentiseradAnvandarId = vi.fn()
const hamtaRollFranDatabasen = vi.fn()
const aterstallMfaForEpost = vi.fn()
const maybeSingle = vi.fn()

vi.mock('@/lib/supabase/route-anvandare', () => ({ hamtaAutentiseradAnvandarId }))
vi.mock('@/lib/auth/roll-server', () => ({ hamtaRollFranDatabasen }))
vi.mock('@/lib/auth/mfa-admin-server', () => ({ aterstallMfaForEpost }))
vi.mock('@/lib/supabase/service', () => ({
  skapaSupabaseServiceklient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle }),
      }),
    }),
  }),
}))

let POST: typeof import('@/app/api/mfa/aterstall/route').POST

beforeAll(async () => {
  ;({ POST } = await import('@/app/api/mfa/aterstall/route'))
})

function fakeRequest(kropp?: unknown): NextRequest {
  return {
    json: async () => {
      if (kropp === undefined) throw new Error('Ogiltig JSON')
      return kropp
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

/**
 * `/api/mfa/aterstall` – administratörsstött MFA-recovery-flöde.
 * Testar HELA auktorisationskedjan i route-handlern (inte bara den
 * underliggande `aterstallMfaForEpost()`-hjälparen, som testas separat i
 * `lib/auth/mfa-admin-server.test.ts`).
 */
describe('POST /api/mfa/aterstall', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('401 utan giltig, MFA-verifierad (aal2) session', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue(null)

    const svar = await POST(fakeRequest({ epost: 'nagon@nova-it.se' }))

    expect(svar.status).toBe(401)
    expect(hamtaRollFranDatabasen).not.toHaveBeenCalled()
    expect(aterstallMfaForEpost).not.toHaveBeenCalled()
  })

  it('403 för en inloggad, MFA-verifierad medarbetare (inte administrator)', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-medarbetare')
    hamtaRollFranDatabasen.mockResolvedValue('medarbetare')

    const svar = await POST(fakeRequest({ epost: 'nagon@nova-it.se' }))

    expect(svar.status).toBe(403)
    expect(aterstallMfaForEpost).not.toHaveBeenCalled()
  })

  it('fail-closed om administratörsrollen inte kan verifieras', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-admin')
    hamtaRollFranDatabasen.mockRejectedValue(new Error('roll nere'))

    const svar = await POST(fakeRequest({ epost: 'nagon@nova-it.se' }))
    const data = await svar.json()

    expect(svar.status).toBe(500)
    expect(data).toEqual({ ok: false, fel: 'Kunde inte verifiera administratörsbehörighet.' })
    expect(maybeSingle).not.toHaveBeenCalled()
    expect(aterstallMfaForEpost).not.toHaveBeenCalled()
  })

  it('administrator tillåts återställa en annan användares MFA', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-admin')
    hamtaRollFranDatabasen.mockResolvedValue('administrator')
    maybeSingle.mockResolvedValue({ data: { epost: 'admin@nova-it.se' }, error: null })
    aterstallMfaForEpost.mockResolvedValue({ ok: true, antalBorttagnaFaktorer: 2 })

    const svar = await POST(fakeRequest({ epost: 'utelast@nova-it.se' }))
    const data = await svar.json()

    expect(svar.status).toBe(200)
    expect(data).toEqual({ ok: true, antalBorttagnaFaktorer: 2 })
    expect(aterstallMfaForEpost).toHaveBeenCalledWith('utelast@nova-it.se')
  })

  it('administrator får INTE återställa sitt eget konto via denna endpoint', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-admin')
    hamtaRollFranDatabasen.mockResolvedValue('administrator')
    maybeSingle.mockResolvedValue({ data: { epost: 'admin@nova-it.se' }, error: null })

    const svar = await POST(fakeRequest({ epost: 'ADMIN@nova-it.se' }))

    expect(svar.status).toBe(400)
    expect(aterstallMfaForEpost).not.toHaveBeenCalled()
  })

  it('400 vid ogiltig JSON-body', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-admin')
    hamtaRollFranDatabasen.mockResolvedValue('administrator')

    const svar = await POST(fakeRequest(undefined))

    expect(svar.status).toBe(400)
    expect(aterstallMfaForEpost).not.toHaveBeenCalled()
  })

  it('400 om e-postadress saknas i body', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-admin')
    hamtaRollFranDatabasen.mockResolvedValue('administrator')

    const svar = await POST(fakeRequest({}))

    expect(svar.status).toBe(400)
    expect(aterstallMfaForEpost).not.toHaveBeenCalled()
  })

  it('400 om e-postadress inte är en sträng', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-admin')
    hamtaRollFranDatabasen.mockResolvedValue('administrator')

    const svar = await POST(fakeRequest({ epost: 123 }))

    expect(svar.status).toBe(400)
    expect(aterstallMfaForEpost).not.toHaveBeenCalled()
  })

  it('400 om e-postadress har ogiltigt format', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-admin')
    hamtaRollFranDatabasen.mockResolvedValue('administrator')

    const svar = await POST(fakeRequest({ epost: 'inte-en-epost' }))
    const data = await svar.json()

    expect(svar.status).toBe(400)
    expect(data).toEqual({ ok: false, fel: 'Ange en giltig e-postadress.' })
    expect(maybeSingle).not.toHaveBeenCalled()
    expect(aterstallMfaForEpost).not.toHaveBeenCalled()
  })

  it('500 om administratörskontot inte kan verifieras mot profiles', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-admin')
    hamtaRollFranDatabasen.mockResolvedValue('administrator')
    maybeSingle.mockResolvedValue({ data: null, error: new Error('profiles nere') })

    const svar = await POST(fakeRequest({ epost: 'utelast@nova-it.se' }))
    const data = await svar.json()

    expect(svar.status).toBe(500)
    expect(data).toEqual({ ok: false, fel: 'Kunde inte verifiera administratörskontot.' })
    expect(aterstallMfaForEpost).not.toHaveBeenCalled()
  })

  it('500 om administratörens egen profil saknar giltig e-post', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-admin')
    hamtaRollFranDatabasen.mockResolvedValue('administrator')
    maybeSingle.mockResolvedValue({ data: { epost: '' }, error: null })

    const svar = await POST(fakeRequest({ epost: 'utelast@nova-it.se' }))
    const data = await svar.json()

    expect(svar.status).toBe(500)
    expect(data).toEqual({ ok: false, fel: 'Kunde inte verifiera administratörskontot.' })
    expect(aterstallMfaForEpost).not.toHaveBeenCalled()
  })

  it('409 (inte 200/ok:true) vid en delvis misslyckad återställning', async () => {
    hamtaAutentiseradAnvandarId.mockResolvedValue('user-admin')
    hamtaRollFranDatabasen.mockResolvedValue('administrator')
    maybeSingle.mockResolvedValue({ data: { epost: 'admin@nova-it.se' }, error: null })
    aterstallMfaForEpost.mockResolvedValue({ ok: false, fel: 'partiell_atersallning', antalKvarvarande: 1 })

    const svar = await POST(fakeRequest({ epost: 'delvis@nova-it.se' }))
    const data = await svar.json()

    expect(svar.status).toBe(409)
    expect(data.ok).toBe(false)
  })
})
