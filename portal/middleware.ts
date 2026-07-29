import { NextResponse, type NextRequest } from 'next/server'

import { adminWorkerDomäner, primarAdminDomän } from '@/lib/admin/worker-konfiguration'
import { uppdateraSessionOchSkyddaPortal } from '@/lib/supabase/proxy'

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
    return NextResponse.redirect(malAdress, 307)
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
    pathname.startsWith('/mfa/')

  if (!arAuthPath) return NextResponse.next()
  return uppdateraSessionOchSkyddaPortal(request)
}

export const config = {
  // Täcker alla paths så att även gamla API-/asset-anrop på alternativa
  // hostar canonicaliseras till admin.nova-it.se innan de behandlas.
  matcher: ['/:path*'],
}
