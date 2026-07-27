import { NextResponse, type NextRequest } from 'next/server'

import { hamtaEgenProfilFranDatabasen, hamtaRollFranDatabasen } from '@/lib/auth/roll-server'
import { hamtaAutentiseradAnvandarId } from '@/lib/supabase/route-anvandare'

/**
 * Returnerar den inloggade användarens systemroll (`SystemRoll`, se
 * `lib/auth/roll.ts`), hämtad direkt från databasen.
 *
 * `useAuth()` litar aldrig på en egen kopia av rollen på klienten – den
 * frågar alltid den här endpointen, som i sin tur alltid frågar
 * `profiles`-tabellen (via service-rollnyckeln, se
 * `lib/supabase/service.ts`). Det är så kravet "servern ska inte lita på
 * klientens roll" uppfylls.
 *
 * Svar: `{ roll: SystemRoll | null }`.
 * 401 om ingen giltig, MFA-verifierad (`aal2`) session finns – se
 * `hamtaAutentiseradAnvandarId()` i `lib/supabase/route-anvandare.ts`, som
 * även nekar en inloggad men inte MFA-verifierad (`aal1`) användare.
 * `{ roll: null }` (200) om användaren av någon anledning saknar profilrad
 * (ska normalt inte hända).
 */
export async function GET(request: NextRequest) {
  const anvandareId = await hamtaAutentiseradAnvandarId(request)

  if (!anvandareId) {
    return NextResponse.json({ roll: null }, { status: 401 })
  }

  const [roll, profil] = await Promise.all([
    hamtaRollFranDatabasen(anvandareId),
    hamtaEgenProfilFranDatabasen(anvandareId),
  ])

  return NextResponse.json({ roll, profil })
}
