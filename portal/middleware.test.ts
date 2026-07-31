import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/proxy', () => ({
  uppdateraSessionOchSkyddaPortal: vi.fn(async () => new Response('auth')),
}))

import { middleware } from './middleware'
import { uppdateraSessionOchSkyddaPortal } from '@/lib/supabase/proxy'

describe('middleware – canonical admin-host', () => {
  it('redirectar den gamla admin-hostens alla paths till huvuddomänen', async () => {
    const svar = await middleware(
      new NextRequest('https://admin.novait.se/api/admin/operativt?x=1'),
    )

    expect(svar.status).toBe(307)
    expect(svar.headers.get('location')).toBe(
      'https://admin.nova-it.se/api/admin/operativt?x=1',
    )
  })

  it('låter huvuddomänens offentliga API passera utan portalsessionskontroll', async () => {
    vi.mocked(uppdateraSessionOchSkyddaPortal).mockClear()
    const svar = await middleware(new NextRequest('https://admin.nova-it.se/api/public/intag'))

    expect(svar.status).toBe(200)
    expect(vi.mocked(uppdateraSessionOchSkyddaPortal)).not.toHaveBeenCalled()
  })
})

describe('middleware – säkerhetsheaders', () => {
  it('sätter CSP m.fl. på ett svar som passerar utan sessionskontroll', async () => {
    const svar = await middleware(new NextRequest('https://admin.nova-it.se/api/public/intag'))

    expect(svar.headers.get('Content-Security-Policy')).toContain("default-src 'self'")
    expect(svar.headers.get('X-Frame-Options')).toBe('DENY')
    expect(svar.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })

  it('sätter säkerhetsheaders även på svaret från uppdateraSessionOchSkyddaPortal', async () => {
    const svar = await middleware(new NextRequest('https://admin.nova-it.se/portal'))

    expect(svar.headers.get('Content-Security-Policy')).toContain("default-src 'self'")
  })

  it('tar bort X-Powered-By (poweredByHeader:false tillämpas inte av OpenNext)', async () => {
    const svar = await middleware(new NextRequest('https://admin.nova-it.se/api/public/intag'))

    expect(svar.headers.get('X-Powered-By')).toBeNull()
  })
})
