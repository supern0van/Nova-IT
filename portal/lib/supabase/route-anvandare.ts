import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'

import { harUppnattAal2 } from '@/lib/auth/mfa'

/**
 * Läser ut den verifierade användarens id (`sub`) för ett anrop, OM en
 * giltig Supabase-session finns i requestens kakor OCH sessionen har
 * uppnått `aal2` (dvs. obligatorisk MFA/TOTP är genomförd – se
 * `lib/auth/mfa.ts`). Används av Route Handlers som behöver veta VEM som
 * anropar innan de går vidare till databasen (t.ex. `/api/roll`).
 *
 * Detta är den servergräns som uppfyller kravet "servern ska inte lita på
 * klientens roll" OCH "ingen åtkomst till skyddade serverfunktioner innan
 * MFA är verifierad": en autentiserad men inte MFA-verifierad användare
 * (`aal1`) får `null` tillbaka precis som en helt oautentiserad användare –
 * anroparen kan inte skilja de två åt, och ska inte behöva göra det.
 *
 * Skiljer sig medvetet från `lib/supabase/proxy.ts`: den här hjälparen
 * omdirigerar aldrig och skriver inga kakor tillbaka – den bara läser och
 * verifierar. `/api/roll` täcks inte av proxyns matcher (den matchar bara
 * `/`, `/portal(/:path*)`, `/mfa(/:path*)` och `/logga-in`), så Route
 * Handlern verifierar sessionen OCH assurance-nivån helt själv, oberoende
 * av proxyn.
 *
 * Samma anledning till `getClaims()` istället för `getSession()` som i
 * proxyn: `getClaims()` verifierar JWT:t (inklusive `aal`-claimet), medan
 * `getSession()` litar bara på kakans innehåll.
 */
export async function hamtaAutentiseradAnvandarId(request: NextRequest): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !publishableKey) return null

  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: () => {
        // Läser bara. Sessionens kakor uppdateras redan av proxyn.
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims) return null
  if (!harUppnattAal2(claims.aal)) return null

  return typeof claims.sub === 'string' && claims.sub.trim() ? claims.sub : null
}
