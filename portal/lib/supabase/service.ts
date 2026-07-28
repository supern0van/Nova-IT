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
