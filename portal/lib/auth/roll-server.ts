import { arSystemRoll, type SystemRoll } from '@/lib/auth/roll'
import { skapaSupabaseServiceklient } from '@/lib/supabase/service'

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
  try {
    const supabase = skapaSupabaseServiceklient()
    const { data, error } = await supabase
      .from('profiles')
      .select('roll')
      .eq('id', anvandareId)
      .maybeSingle()

    if (error || !data || !arSystemRoll(data.roll)) return null
    return data.roll
  } catch {
    return null
  }
}

export interface EgenProfil {
  epost: string
  namn: string
}

export async function hamtaEgenProfilFranDatabasen(
  anvandareId: string,
): Promise<EgenProfil | null> {
  try {
    const supabase = skapaSupabaseServiceklient()
    const { data, error } = await supabase
      .from('profiles')
      .select('epost, namn')
      .eq('id', anvandareId)
      .maybeSingle()

    if (error || !data || !arGiltigEgenProfil(data)) return null
    return data
  } catch {
    return null
  }
}

function arGiltigEgenProfil(data: unknown): data is EgenProfil {
  if (typeof data !== 'object' || data === null) return false
  if (!('epost' in data) || !('namn' in data)) return false

  return (
    typeof data.epost === 'string' &&
    data.epost.trim().length > 0 &&
    typeof data.namn === 'string' &&
    data.namn.trim().length > 0
  )
}
