import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'

/**
 * Läser ut den verifierade användarens id (`sub`) för ett anrop, om en
 * giltig Supabase-session finns i requestens kakor. Används av Route
 * Handlers som behöver veta VEM som anropar innan de går vidare till
 * databasen (t.ex. `/api/roll`).
 *
 * Skiljer sig medvetet från `lib/supabase/proxy.ts`: den här hjälparen
 * omdirigerar aldrig och skriver inga kakor tillbaka – den bara läser och
 * verifierar. `/api/roll` täcks inte av proxyns matcher (den matchar bara
 * `/`, `/portal(/:path*)` och `/logga-in`), så Route Handlern verifierar
 * sessionen helt själv, oberoende av proxyn.
 *
 * Samma anledning till `getClaims()` istället för `getSession()` som i
 * proxyn: `getClaims()` verifierar JWT:t, `getSession()` litar bara på
 * kakans innehåll.
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
  return data?.claims?.sub ?? null
}
