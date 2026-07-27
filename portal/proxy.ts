import type { NextRequest } from 'next/server'

import { uppdateraSessionOchSkyddaPortal } from '@/lib/supabase/proxy'

/**
 * Next.js 16 Proxy (ersätter tidigare middleware.ts – funktionen är
 * densamma, bara namnet har ändrats:
 * https://nextjs.org/docs/app/api-reference/file-conventions/proxy).
 *
 * Körs på servern (Node.js-runtime) innan någon route renderas. Det är
 * enda platsen i portalen som kan garantera att en oautentiserad klient
 * aldrig får skyddat innehåll skickat till sig, oavsett vilken adress som
 * skrivs in direkt i webbläsaren.
 *
 * Hålls medvetet tunn – själva implementationen bor i
 * `lib/supabase/proxy.ts`, i linje med Supabases rekommenderade struktur
 * (klient-, server- och proxyhjälpare i `lib/supabase/`).
 */
export async function proxy(request: NextRequest) {
  return uppdateraSessionOchSkyddaPortal(request)
}

export const config = {
  // Täcker samtliga routes som finns i portalens Next.js-app:
  // "/" (skickar vidare till /portal), "/portal" + alla underrutter,
  // inloggningssidan (för att kunna skicka vidare redan inloggade dit bort),
  // samt "/mfa" (obligatorisk MFA/TOTP-enrollment och -verifiering).
  matcher: ['/', '/portal', '/portal/:path*', '/logga-in', '/mfa', '/mfa/:path*'],
}
