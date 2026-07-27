import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { sakerOmdirigeringsSokvag } from '@/lib/auth/sakerOmdirigering'
import { MFA_VAG, harUppnattAal2 } from '@/lib/auth/mfa'

const INLOGGNINGSVAG = '/logga-in'
const STANDARDVAG_EFTER_INLOGGNING = '/portal'

/**
 * Portalens serversidesskydd (Next.js 16 Proxy – se `../../proxy.ts`).
 *
 * Bygger på Supabases officiella mönster för `@supabase/ssr` i Next.js App
 * Router (https://supabase.com/docs/guides/auth/server-side/nextjs): en
 * Supabase-klient kopplas till requestens och svarets kakor, och
 * `getClaims()` verifierar JWT:t lokalt mot projektets publicerade nycklar.
 *
 * `getSession()` används MEDVETET INTE här. Enligt Supabases egen
 * dokumentation är den inte garanterad att verifiera token på nytt och kan
 * därför inte litas på för ett åtkomstbeslut på servern – kakor kan i teorin
 * förfalskas av klienten. `getClaims()` verifierar JWT-signaturen mot
 * projektets nycklar vid varje anrop och är det som faktiskt skyddar sidan.
 *
 * Obligatorisk MFA/TOTP (steg 4): `getClaims()` returnerar även `aal`-claimet
 * (Authenticator Assurance Level, se `lib/auth/mfa.ts`). En session som
 * bara är `aal1` – inloggad men INTE MFA-verifierad, oavsett om det beror på
 * att användaren aldrig satt upp MFA, eller bara inte verifierat den här
 * sessionen än – behandlas här som otillräcklig för `/portal`. I linje med
 * Supabases egen rekommendation
 * (https://supabase.com/docs/guides/auth/auth-mfa#server-side-rendering)
 * skickas användaren INTE till en 401/403-sida utan vidare till `/mfa`, där
 * `components/auth/mfa-vy.tsx` själv – via klientens Supabase-SDK – avgör om
 * det ska visas en enrollment- eller en verifieringsvy.
 *
 * Utöver sessionsuppdateringen (som Supabases exempel gör) styr denna
 * funktion portalens omdirigeringsregler:
 *   1. Ingen giltig session + skyddad route (`/portal/*`, `/mfa/*`) →
 *      /logga-in, med ursprunglig destination bevarad i en validerad
 *      `next`-parameter.
 *   2. Giltig session men `aal1` + `/portal/*` → `/mfa`, med samma
 *      `next`-bevarande.
 *   3. Giltig session + `aal2` (redan MFA-verifierad) + `/mfa` eller
 *      `/logga-in` → /portal, eller den validerade `next`-destinationen om
 *      en sådan finns.
 */
export async function uppdateraSessionOchSkyddaPortal(request: NextRequest) {
  const { pathname } = request.nextUrl
  const arInloggningssida = pathname === INLOGGNINGSVAG || pathname.startsWith(`${INLOGGNINGSVAG}/`)
  const arMfaSida = pathname === MFA_VAG || pathname.startsWith(`${MFA_VAG}/`)
  const arLosenordsaterstallning = arInloggningssida && request.nextUrl.searchParams.get('aterstall') === '1'

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !publishableKey) {
    // Miljövariablerna saknas. Faller stängt: skyddade routes nekas istället
    // för att släppas igenom. /logga-in renderas ändå – där ger den
    // befintliga `skapaSupabaseWebblasarklient()` samma tydliga körningsfel
    // som tidigare, istället för att proxyn kraschar för varje request.
    if (arInloggningssida) {
      return NextResponse.next({ request })
    }
    const malAdress = request.nextUrl.clone()
    malAdress.pathname = INLOGGNINGSVAG
    malAdress.search = ''
    return NextResponse.redirect(malAdress)
  }

  let svar = NextResponse.next({ request })

  // Med Fluid compute (eller liknande återanvänd exekveringsmiljö): skapa
  // aldrig klienten i en modul-global variabel. En ny klient per request,
  // enligt Supabases rekommendation.
  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        svar = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => svar.cookies.set(name, value, options))
        Object.entries(headers).forEach(([name, value]) => svar.headers.set(name, value))
      },
    },
  })

  // Kör ingen kod mellan createServerClient och getClaims(). Enligt Supabase
  // kan även ett litet misstag här göra det väldigt svårt att felsöka
  // användare som slumpmässigt loggas ut.
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  const inloggad = Boolean(claims)
  // `aal` saknas aldrig i praktiken när `claims` finns (obligatoriskt claim
  // enligt Supabase), men faller stängt (`aal1`) om det ändå skulle saknas.
  const mfaVerifierad = inloggad && harUppnattAal2(claims?.aal ?? 'aal1')

  /** Skickar en inloggad, MFA-verifierad användare vidare till /portal (eller en validerad `next`-destination). */
  function omdirigeraTillInloggadDestination() {
    const onskadDestination = sakerOmdirigeringsSokvag(request.nextUrl.searchParams.get('next'))
    const malAdress = request.nextUrl.clone()

    if (
      onskadDestination &&
      !onskadDestination.startsWith(INLOGGNINGSVAG) &&
      !onskadDestination.startsWith(MFA_VAG)
    ) {
      const [sokvag, sokstrang] = delaSokvagOchFraga(onskadDestination)
      malAdress.pathname = sokvag
      malAdress.search = sokstrang
    } else {
      malAdress.pathname = STANDARDVAG_EFTER_INLOGGNING
      malAdress.search = ''
    }
    return NextResponse.redirect(malAdress)
  }

  /** Skickar en inloggad men inte MFA-verifierad användare till /mfa, med ursprunglig destination bevarad. */
  function omdirigeraTillMfa() {
    const ursprungligDestination = `${pathname}${request.nextUrl.search}`
    const malAdress = request.nextUrl.clone()
    malAdress.pathname = MFA_VAG
    malAdress.search = ''
    // Undvik att kedja `next`-parametrar in i varandra om användaren redan
    // kom hit med en (t.ex. /logga-in?next=/portal/kunder).
    const befintligNext = sakerOmdirigeringsSokvag(request.nextUrl.searchParams.get('next'))
    malAdress.searchParams.set(
      'next',
      befintligNext && !befintligNext.startsWith(MFA_VAG) ? befintligNext : ursprungligDestination,
    )
    return NextResponse.redirect(malAdress)
  }

  if (arInloggningssida) {
    // Supabase password recovery skapar en tillfällig session som ofta bara
    // är `aal1`. Den måste få rendera /logga-in?aterstall=1 så användaren kan
    // välja nytt lösenord innan ordinarie obligatorisk MFA tar vid igen.
    if (arLosenordsaterstallning) return svar
    if (!inloggad) return svar
    if (!mfaVerifierad) return omdirigeraTillMfa()
    return omdirigeraTillInloggadDestination()
  }

  if (arMfaSida) {
    if (!inloggad) {
      const malAdress = request.nextUrl.clone()
      malAdress.pathname = INLOGGNINGSVAG
      malAdress.search = ''
      return NextResponse.redirect(malAdress)
    }
    // Redan MFA-verifierad (t.ex. bakåtknapp till /mfa, eller en flik som
    // stod öppen på /mfa i en annan flik medan verifiering skedde) – inget
    // skäl att visa MFA-vyn igen.
    if (mfaVerifierad) return omdirigeraTillInloggadDestination()
    return svar
  }

  if (!inloggad) {
    const ursprungligDestination = `${pathname}${request.nextUrl.search}`
    const malAdress = request.nextUrl.clone()
    malAdress.pathname = INLOGGNINGSVAG
    malAdress.search = ''
    malAdress.searchParams.set('next', ursprungligDestination)
    return NextResponse.redirect(malAdress)
  }

  // Inloggad men inte MFA-verifierad: obligatorisk MFA innebär att INGEN
  // skyddad portalroute (`/portal/*`) får renderas eller returnera skyddat
  // innehåll förrän `aal2` är uppnått – oavsett vad klienten själv tror.
  if (!mfaVerifierad) return omdirigeraTillMfa()

  // VIKTIGT: `svar` måste returneras precis som den är (med kakorna som
  // Supabase-klienten satte ovan) – annars kan webbläsaren och servern
  // hamna ur synk och avsluta användarens session i förtid.
  return svar
}

function delaSokvagOchFraga(varde: string): [string, string] {
  const index = varde.indexOf('?')
  if (index === -1) return [varde, '']
  return [varde.slice(0, index), varde.slice(index)]
}
