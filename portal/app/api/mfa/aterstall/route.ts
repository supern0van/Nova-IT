import { NextResponse, type NextRequest } from 'next/server'

import { aterstallMfaForEpost } from '@/lib/auth/mfa-admin-server'
import { arAdministrator } from '@/lib/auth/roll'
import { hamtaRollFranDatabasen } from '@/lib/auth/roll-server'
import { hamtaAutentiseradAnvandarId } from '@/lib/supabase/route-anvandare'
import { skapaSupabaseServiceklient } from '@/lib/supabase/service'

const EPOST_MONSTER = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Administratörsstött MFA-återställningsflöde (recovery), se
 * `lib/auth/mfa-admin-server.ts` för bakgrund och motivering.
 *
 * Skyddad i tre steg, alla på servern:
 *   1. `hamtaAutentiseradAnvandarId()` – kräver en giltig OCH `aal2`-verifierad
 *      session (precis som `/api/roll`, se `lib/supabase/route-anvandare.ts`).
 *      En administratör som själv inte har genomfört MFA kan alltså inte
 *      återställa någon annans MFA.
 *   2. `hamtaRollFranDatabasen()` – den anropande användarens `SystemRoll`
 *      måste vara `administrator`. Detta är en fristående auktorisationskontroll
 *      och blandas INTE ihop med MFA/AAL – se `lib/auth/mfa.ts`.
 *   3. En administratör kan inte återställa sitt EGET konto via denna
 *      endpoint (skulle kunna låsa ute sig själv av misstag) – självbetjäning
 *      för egna faktorer sker istället under `/portal/sakerhet`.
 *
 * Svar: `{ ok: true, antalBorttagnaFaktorer: number }` eller
 * `{ ok: false, fel: string }`. En delvis misslyckad återställning (t.ex. en
 * av två faktorer kunde inte tas bort) rapporteras ALDRIG som `ok: true` –
 * se `aterstallMfaForEpost()` i `lib/auth/mfa-admin-server.ts`, som verifierar
 * sluttillståndet med ett nytt `listFactors()`-anrop innan den svarar.
 */
export async function POST(request: NextRequest) {
  const anvandareId = await hamtaAutentiseradAnvandarId(request)
  if (!anvandareId) {
    return NextResponse.json(
      { ok: false, fel: 'Kräver inloggning och verifierad tvåstegsverifiering.' },
      { status: 401 },
    )
  }

  let roll: Awaited<ReturnType<typeof hamtaRollFranDatabasen>>
  try {
    roll = await hamtaRollFranDatabasen(anvandareId)
  } catch {
    return NextResponse.json(
      { ok: false, fel: 'Kunde inte verifiera administratörsbehörighet.' },
      { status: 500 },
    )
  }

  if (!arAdministrator(roll)) {
    return NextResponse.json({ ok: false, fel: 'Kräver administratörsbehörighet.' }, { status: 403 })
  }

  let kropp: unknown
  try {
    kropp = await request.json()
  } catch {
    return NextResponse.json({ ok: false, fel: 'Ogiltig begäran.' }, { status: 400 })
  }

  const epost = hamtaEpostFranBody(kropp)

  if (!epost) {
    return NextResponse.json({ ok: false, fel: 'Ange en e-postadress.' }, { status: 400 })
  }

  if (!EPOST_MONSTER.test(epost)) {
    return NextResponse.json(
      { ok: false, fel: 'Ange en giltig e-postadress.' },
      { status: 400 },
    )
  }

  // Skyddar mot att en administratör (av misstag) återställer sitt eget
  // konto via den här endpointen – hämtar den inloggade adminens e-post via
  // service-klienten (aldrig den från klientens inskickade `epost`-fält).
  let egenEpost: string | null = null
  try {
    const service = skapaSupabaseServiceklient()
    const { data, error } = await service
      .from('profiles')
      .select('epost')
      .eq('id', anvandareId)
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { ok: false, fel: 'Kunde inte verifiera administratörskontot.' },
        { status: 500 },
      )
    }

    egenEpost = hamtaEpostFranProfil(data)
  } catch {
    return NextResponse.json(
      { ok: false, fel: 'Kunde inte verifiera administratörskontot.' },
      { status: 500 },
    )
  }

  if (!egenEpost) {
    return NextResponse.json(
      { ok: false, fel: 'Kunde inte verifiera administratörskontot.' },
      { status: 500 },
    )
  }

  if (egenEpost === epost.toLowerCase()) {
    return NextResponse.json(
      {
        ok: false,
        fel: 'Du kan inte återställa din egen tvåstegsverifiering här – hantera dina egna enheter under Säkerhet.',
      },
      { status: 400 },
    )
  }

  const resultat = await aterstallMfaForEpost(epost)
  if (!resultat.ok) {
    if (resultat.fel === 'partiell_atersallning') {
      return NextResponse.json(
        {
          ok: false,
          fel: `Återställningen kunde inte slutföras – ${resultat.antalKvarvarande} enhet(er) finns fortfarande kvar på kontot. Försök igen.`,
        },
        { status: 409 },
      )
    }
    const meddelanden: Record<Exclude<typeof resultat.fel, 'partiell_atersallning'>, string> = {
      anvandare_saknas: 'Hittade ingen användare med den e-postadressen.',
      inga_faktorer: 'Användaren har ingen tvåstegsverifiering att återställa.',
      serverfel: 'Kunde inte återställa tvåstegsverifieringen. Försök igen.',
    }
    return NextResponse.json({ ok: false, fel: meddelanden[resultat.fel] }, { status: 400 })
  }

  return NextResponse.json({ ok: true, antalBorttagnaFaktorer: resultat.antalBorttagnaFaktorer })
}

function hamtaEpostFranBody(kropp: unknown): string {
  if (typeof kropp !== 'object' || kropp === null || !('epost' in kropp)) return ''
  const epost = kropp.epost
  return typeof epost === 'string' ? epost.trim().toLowerCase() : ''
}

function hamtaEpostFranProfil(profil: unknown): string | null {
  if (typeof profil !== 'object' || profil === null || !('epost' in profil)) return null
  const epost = profil.epost
  if (typeof epost !== 'string') return null
  const normaliserad = epost.trim().toLowerCase()
  return EPOST_MONSTER.test(normaliserad) ? normaliserad : null
}
