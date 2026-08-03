import { NextRequest, NextResponse } from 'next/server'

import { adminWorkerDomäner, primarAdminDomän } from '@/lib/admin/worker-konfiguration'
import { uppdateraSessionOchSkyddaPortal } from '@/lib/supabase/proxy'

// next.config.mjs's headers() visade sig INTE tillämpas av OpenNext på
// Cloudflare Workers (bekräftat live: varken CSP eller poweredByHeader:false
// syntes i svaren). Middleware körs garanterat på varje request (se matcher
// nedan) och är den enda punkt som faktiskt fungerar för det här.
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=15552000; includeSubDomains',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

function skapaContentSecurityPolicy(nonce: string): string {
  const utvecklingsTillagg = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${utvecklingsTillagg}`,
    "connect-src 'self' https://*.supabase.co",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

function medSakerhetsHeaders(svar: NextResponse, contentSecurityPolicy: string): NextResponse {
  for (const [namn, varde] of Object.entries(SECURITY_HEADERS)) {
    svar.headers.set(namn, varde)
  }
  svar.headers.set('Content-Security-Policy', contentSecurityPolicy)
  // next.config.mjs's poweredByHeader:false tas inte bort av OpenNext på
  // Cloudflare Workers (bekräftat live) - ta bort den explicit här istället.
  svar.headers.delete('X-Powered-By')
  return svar
}

/**
 * Next.js Middleware körs på servern (Edge-runtime) innan någon route
 * renderas. Portalen använder medvetet Middleware tills OpenNext stödjer
 * Next.js 16:s Node-baserade `proxy.ts`, så att samma serverskydd kan köras
 * i den separata Cloudflare-workern.
 *
 * Det är
 * enda platsen i portalen som kan garantera att en oautentiserad klient
 * aldrig får skyddat innehåll skickat till sig, oavsett vilken adress som
 * skrivs in direkt i webbläsaren.
 *
 * Hålls medvetet tunn – själva implementationen bor i
 * `lib/supabase/proxy.ts`, i linje med Supabases rekommenderade struktur
 * (klient-, server- och proxyhjälpare i `lib/supabase/`).
 */
export async function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll('-', '')
  const contentSecurityPolicy = skapaContentSecurityPolicy(nonce)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy)
  const sakerRequest = new NextRequest(request, { headers: requestHeaders })

  const hostname = request.nextUrl.hostname.toLowerCase()
  const arKandAdminHost = adminWorkerDomäner.some((domän) => domän.toLowerCase() === hostname)

  // Supabase använder hostbundna sessionskakor. Om alternativa hostar får
  // rendera portalen kan en gammal cookie där leva vidare separat från
  // huvuddomänen. Canonicalisera därför innan någon route eller auth-cookie
  // behandlas, även för API- och asset-anrop.
  if (arKandAdminHost && hostname !== primarAdminDomän) {
    const malAdress = request.nextUrl.clone()
    malAdress.protocol = 'https:'
    malAdress.hostname = primarAdminDomän
    malAdress.port = ''
    return medSakerhetsHeaders(NextResponse.redirect(malAdress, 307), contentSecurityPolicy)
  }

  // Middleware körs nu på alla paths för att kunna canonicalisera även API:n.
  // Auth-skyddet behövs bara på portalens routes; övriga paths ska passera.
  const { pathname } = request.nextUrl
  const arAuthPath =
    pathname === '/' ||
    pathname === '/portal' ||
    pathname.startsWith('/portal/') ||
    pathname === '/logga-in' ||
    pathname.startsWith('/logga-in/') ||
    pathname === '/mfa' ||
    pathname.startsWith('/mfa/') ||
    pathname === '/api/roll' ||
    pathname === '/api/session/lease' ||
    pathname.startsWith('/api/admin/') ||
    pathname.startsWith('/api/mfa/')

  if (!arAuthPath) {
    return medSakerhetsHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
      contentSecurityPolicy,
    )
  }
  return medSakerhetsHeaders(
    await uppdateraSessionOchSkyddaPortal(sakerRequest),
    contentSecurityPolicy,
  )
}

export const config = {
  // Täcker alla paths så att även gamla API-/asset-anrop på alternativa
  // hostar canonicaliseras till admin.nova-it.se innan de behandlas.
  matcher: ['/:path*'],
}
