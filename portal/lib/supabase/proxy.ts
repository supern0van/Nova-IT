import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { sakerOmdirigeringsSokvag } from '@/lib/auth/sakerOmdirigering'

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
 * Utöver sessionsuppdateringen (som Supabases exempel gör) styr denna
 * funktion portalens två omdirigeringsregler:
 *   1. Ingen giltig session + skyddad route → /logga-in, med ursprunglig
 *      destination bevarad i en validerad `next`-parameter.
 *   2. Giltig session + /logga-in → /portal, eller den validerade
 *      `next`-destinationen om en sådan finns.
 */
export async function uppdateraSessionOchSkyddaPortal(request: NextRequest) {
  const { pathname } = request.nextUrl
  const arInloggningssida = pathname === INLOGGNINGSVAG || pathname.startsWith(`${INLOGGNINGSVAG}/`)

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
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        svar = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => svar.cookies.set(name, value, options))
      },
    },
  })

  // Kör ingen kod mellan createServerClient och getClaims(). Enligt Supabase
  // kan även ett litet misstag här göra det väldigt svårt att felsöka
  // användare som slumpmässigt loggas ut.
  const { data } = await supabase.auth.getClaims()
  const inloggad = Boolean(data?.claims)

  if (arInloggningssida) {
    if (!inloggad) return svar

    const onskadDestination = sakerOmdirigeringsSokvag(request.nextUrl.searchParams.get('next'))
    const malAdress = request.nextUrl.clone()

    if (onskadDestination && !onskadDestination.startsWith(INLOGGNINGSVAG)) {
      const [sokvag, sokstrang] = delaSokvagOchFraga(onskadDestination)
      malAdress.pathname = sokvag
      malAdress.search = sokstrang
    } else {
      malAdress.pathname = STANDARDVAG_EFTER_INLOGGNING
      malAdress.search = ''
    }
    return NextResponse.redirect(malAdress)
  }

  if (!inloggad) {
    const ursprungligDestination = `${pathname}${request.nextUrl.search}`
    const malAdress = request.nextUrl.clone()
    malAdress.pathname = INLOGGNINGSVAG
    malAdress.search = ''
    malAdress.searchParams.set('next', ursprungligDestination)
    return NextResponse.redirect(malAdress)
  }

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
