import 'server-only'

import { createClient } from '@supabase/supabase-js'

/**
 * Service-rollklient.
 *
 * ANVÄND ENDAST PÅ SERVERN (Route Handlers, Server Actions, Server
 * Components). Importera ALDRIG denna fil från en `'use client'`-komponent –
 * `SUPABASE_SERVICE_ROLE_KEY` saknar `NEXT_PUBLIC_`-prefix och ska aldrig
 * paketeras med till webbläsaren.
 *
 * `import 'server-only'` är en byggtidsspärr utöver `service.test.ts`:s
 * textbaserade sökning efter direkta importer i `'use client'`-filer – den
 * fångar även TRANSITIVA importer (en klientkomponent som importerar en
 * hjälpmodul utan egen `'use client'`-direktiv, som i sin tur importerar den
 * här filen). Next.js/webpack kraschar då bygget i stället för att tyst
 * paketera nyckeln till webbläsaren.
 *
 * Nyckeln kringgår alla PostgREST-grants (motsvarande att vara
 * databasägaren). Det är avsiktligt: `public.profiles` har inga privilegier
 * för `anon`/`authenticated` (se migrationen), så det är bara denna klient
 * som kan läsa tabellen alls. Skapa aldrig klienten i en modulglobal
 * variabel – en ny instans per anrop, precis som Supabase rekommenderar för
 * server-klienter.
 */
export function skapaSupabaseServiceklient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Saknar NEXT_PUBLIC_SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY. Se .env.example.',
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
