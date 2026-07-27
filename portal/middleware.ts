import type { NextRequest } from 'next/server'

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
  return uppdateraSessionOchSkyddaPortal(request)
}

export const config = {
  // Täcker samtliga routes som finns i portalens Next.js-app:
  // "/" (skickar vidare till /portal), "/portal" + alla underrutter,
  // inloggningssidan (för att kunna skicka vidare redan inloggade dit bort),
  // samt "/mfa" (obligatorisk MFA/TOTP-enrollment och -verifiering).
  matcher: ['/', '/portal', '/portal/:path*', '/logga-in', '/mfa', '/mfa/:path*'],
}
