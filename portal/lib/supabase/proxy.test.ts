import { NextRequest } from 'next/server'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

const getClaims = vi.fn()
const createServerClient = vi.fn(() => ({
  auth: { getClaims },
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient,
}))

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key'

let uppdateraSessionOchSkyddaPortal: typeof import('@/lib/supabase/proxy').uppdateraSessionOchSkyddaPortal

beforeAll(async () => {
  ;({ uppdateraSessionOchSkyddaPortal } = await import('@/lib/supabase/proxy'))
})

function begaran(vag: string) {
  return new NextRequest(new URL(vag, 'https://portal.nova-it.se'))
}

function ingenSession() {
  getClaims.mockResolvedValue({ data: { claims: null } })
}

function sessionMedNiva(aal: 'aal1' | 'aal2') {
  getClaims.mockResolvedValue({ data: { claims: { sub: 'user-1', aal } } })
}

/** Är svaret en omdirigering, och i så fall till vilken sökväg (+ ev. `next`)? */
function omdirigeringsmal(svar: Response) {
  if (svar.status < 300 || svar.status >= 400) return null
  const plats = svar.headers.get('location')
  return plats ? new URL(plats) : null
}

describe('uppdateraSessionOchSkyddaPortal – obligatorisk MFA', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('/portal (skyddad route)', () => {
    it('sätter cache-skydd när Supabase uppdaterar sessionskakor', async () => {
      createServerClient.mockImplementationOnce(
        ((_url: string, _key: string, options: unknown) => ({
          auth: {
            getClaims: async () => {
              const cookies = (options as {
                cookies: {
                  setAll?: (
                    cookiesToSet: { name: string; value: string; options: Record<string, never> }[],
                    headers: Record<string, string>,
                  ) => void
                }
              }).cookies

              cookies.setAll?.(
                [{ name: 'sb-access-token', value: 'uppdaterad', options: {} }],
                {
                  'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
                  Expires: '0',
                  Pragma: 'no-cache',
                },
              )

              return { data: { claims: { sub: 'user-1', aal: 'aal2' } } }
            },
          },
        })) as never,
      )

      const svar = await uppdateraSessionOchSkyddaPortal(begaran('/portal/arenden'))

      expect(svar.headers.get('Cache-Control')).toBe('private, no-cache, no-store, must-revalidate, max-age=0')
      expect(svar.headers.get('Expires')).toBe('0')
      expect(svar.headers.get('Pragma')).toBe('no-cache')
    })

    it('blockerad åtkomst: utloggad användare skickas till /logga-in med bevarad destination', async () => {
      ingenSession()
      const svar = await uppdateraSessionOchSkyddaPortal(begaran('/portal/kunder'))
      const mal = omdirigeringsmal(svar)
      expect(mal?.pathname).toBe('/logga-in')
      expect(mal?.searchParams.get('next')).toBe('/portal/kunder')
    })

    it('blockerad åtkomst före MFA: inloggad men aal1 skickas till /mfa, inte in i portalen', async () => {
      sessionMedNiva('aal1')
      const svar = await uppdateraSessionOchSkyddaPortal(begaran('/portal/arenden'))
      const mal = omdirigeringsmal(svar)
      expect(mal?.pathname).toBe('/mfa')
      expect(mal?.searchParams.get('next')).toBe('/portal/arenden')
    })

    it('tillåten åtkomst efter MFA: aal2 släpps igenom utan omdirigering', async () => {
      sessionMedNiva('aal2')
      const svar = await uppdateraSessionOchSkyddaPortal(begaran('/portal/arenden'))
      expect(omdirigeringsmal(svar)).toBeNull()
    })
  })

  describe('/logga-in', () => {
    it('utloggad: renderas normalt (ingen omdirigering)', async () => {
      ingenSession()
      const svar = await uppdateraSessionOchSkyddaPortal(begaran('/logga-in'))
      expect(omdirigeringsmal(svar)).toBeNull()
    })

    it('redan inloggad men INTE MFA-verifierad: skickas till /mfa (inte /portal)', async () => {
      sessionMedNiva('aal1')
      const svar = await uppdateraSessionOchSkyddaPortal(begaran('/logga-in'))
      const mal = omdirigeringsmal(svar)
      expect(mal?.pathname).toBe('/mfa')
    })

    it('lösenordsåterställning: aal1-session får rendera /logga-in?aterstall=1', async () => {
      sessionMedNiva('aal1')
      const svar = await uppdateraSessionOchSkyddaPortal(begaran('/logga-in?aterstall=1'))
      expect(omdirigeringsmal(svar)).toBeNull()
    })

    it('redan inloggad OCH MFA-verifierad: skickas vidare till /portal', async () => {
      sessionMedNiva('aal2')
      const svar = await uppdateraSessionOchSkyddaPortal(begaran('/logga-in'))
      const mal = omdirigeringsmal(svar)
      expect(mal?.pathname).toBe('/portal')
    })

    it('återinloggning: en tidigare utgången session (ingen session) renderar inloggningssidan på nytt', async () => {
      ingenSession()
      const svar = await uppdateraSessionOchSkyddaPortal(begaran('/logga-in?next=%2Fportal%2Fkunder'))
      expect(omdirigeringsmal(svar)).toBeNull()
    })
  })

  describe('/mfa', () => {
    it('utloggad besökare skickas till /logga-in', async () => {
      ingenSession()
      const svar = await uppdateraSessionOchSkyddaPortal(begaran('/mfa'))
      const mal = omdirigeringsmal(svar)
      expect(mal?.pathname).toBe('/logga-in')
    })

    it('inloggad men aal1: renderas normalt (enrollment/verifiering ska visas)', async () => {
      sessionMedNiva('aal1')
      const svar = await uppdateraSessionOchSkyddaPortal(begaran('/mfa'))
      expect(omdirigeringsmal(svar)).toBeNull()
    })

    it('redan aal2-verifierad: skickas vidare in i portalen istället för att visa MFA-vyn igen', async () => {
      sessionMedNiva('aal2')
      const svar = await uppdateraSessionOchSkyddaPortal(begaran('/mfa'))
      const mal = omdirigeringsmal(svar)
      expect(mal?.pathname).toBe('/portal')
    })
  })
})
