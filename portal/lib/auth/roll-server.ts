import { skapaSupabaseServiceklient } from '@/lib/supabase/service'
import type { SystemRoll } from '@/lib/auth/roll'

/**
 * SERVER-ONLY. Databasåtkomst för systemrollen.
 *
 * Utbruten ur `lib/auth/roll.ts` (som bara innehåller typer och rena
 * hjälpfunktioner) just för att den filen ska kunna importeras fritt från
 * klientkod – t.ex. `components/auth/auth-provider.tsx`, som bara behöver
 * `type SystemRoll` därifrån. Den här filen importerar
 * `skapaSupabaseServiceklient()` (service-rollnyckeln) och ska ALDRIG
 * importeras från en `'use client'`-komponent.
 *
 * Används idag bara av `app/api/roll/route.ts`. Tänkt att återanvändas av
 * framtida Route Handlers/Server Actions/Server Components som behöver
 * slå upp en användares systemroll.
 */

/**
 * Hämtar den angivna användarens systemroll direkt från `profiles`-tabellen
 * med service-rollnyckeln (se `lib/supabase/service.ts`) – tabellen har
 * inga klientprivilegier, så det här är den enda vägen in.
 *
 * Returnerar `null` om användaren saknar profil (bör inte hända – triggern
 * `on_auth_user_created` skapar profilen automatiskt, se migrationen) eller
 * om frågan misslyckas.
 */
export async function hamtaRollFranDatabasen(anvandareId: string): Promise<SystemRoll | null> {
  const supabase = skapaSupabaseServiceklient()
  const { data, error } = await supabase
    .from('profiles')
    .select('roll')
    .eq('id', anvandareId)
    .maybeSingle()

  if (error || !data) return null
  return data.roll as SystemRoll
}

export interface EgenProfil {
  epost: string
  namn: string
}

export async function hamtaEgenProfilFranDatabasen(
  anvandareId: string,
): Promise<EgenProfil | null> {
  const supabase = skapaSupabaseServiceklient()
  const { data, error } = await supabase
    .from('profiles')
    .select('epost, namn')
    .eq('id', anvandareId)
    .maybeSingle()

  if (error || !data) return null
  return data as EgenProfil
}
