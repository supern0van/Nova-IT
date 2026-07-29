/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  AUTENTISERING – SUPABASE (E-POST + LÖSENORD)                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Denna modul är den ENDA platsen i portalen som vet hur inloggning fungerar.
 * Allt annat i applikationen använder `useAuth()` från
 * `components/auth/auth-provider.tsx`, som i sin tur anropar detta gränssnitt.
 *
 * Inloggning sker mot Supabase Auth (`signInWithPassword`). Sessionen hanteras
 * av Supabase-klienten själv (`@supabase/ssr`) – den håller sitt eget
 * lagringsutrymme i webbläsaren och uppdaterar access-token automatiskt.
 * Portalen sparar ingen egen kopia av lösenord eller sessionsdata i
 * `localStorage` längre.
 *
 * Serversidesskydd av routes finns i `middleware.ts` (Next.js 16), se
 * `lib/supabase/proxy.ts`. Systemroller (SystemRoll) finns i
 * `profiles`-tabellen, se `lib/auth/roll.ts`.
 */

import type {
  AuthChangeEvent,
  Session as SupabaseSession,
  User as SupabaseUser,
} from '@supabase/supabase-js'

import { skapaSupabaseWebblasarklient } from '@/lib/supabase/client'
import { arDemogastEpost } from '@/lib/auth/demo-guest'
import type { Anvandare, Roll } from '@/lib/types'

const IHAGKOMMEN_NYCKEL = 'nova-it.ihagkommen-epost'

/**
 * Namnet på Supabase-sessionshändelsen som utlöste en session-callback.
 * Framför allt intressant för `'MFA_CHALLENGE_VERIFIED'` – händelsen som
 * fyras när `supabase.auth.mfa.verify()` lyckas – så att `AuthProvider` kan
 * hämta om den skyddade rollen (`/api/roll`) efter att en session gått från
 * `aal1` till `aal2`, utan att behöva vänta på en ny inloggning.
 */
export type AuthChangeEventNamn = AuthChangeEvent

export interface Session {
  anvandareId: string
  epost: string
  roll: Roll
  /** Unix-tidsstämpel (ms) när Supabase-sessionens access-token upphör. */
  upphorVid: number | null
  ihagkommen: boolean
}

export type InloggningsFel =
  | 'saknade_uppgifter'
  | 'ogiltig_epost'
  | 'fel_uppgifter'
  | 'konto_inaktivt'
  | 'svagt_losenord'
  | 'lackt_losenord'
  | 'serverfel'

export const felmeddelanden: Record<InloggningsFel, string> = {
  saknade_uppgifter: 'Fyll i både e-postadress och lösenord.',
  ogiltig_epost: 'Ange en giltig e-postadress.',
  fel_uppgifter: 'Fel e-postadress eller lösenord. Kontrollera uppgifterna och försök igen.',
  konto_inaktivt: 'Kontot är inaktiverat. Kontakta en administratör för att få det aktiverat.',
  svagt_losenord: 'Lösenordet behöver vara minst 8 tecken.',
  lackt_losenord:
    'Det här lösenordet har förekommit i en känd dataläcka. Välj ett annat lösenord.',
  serverfel: 'Kunde inte slutföra åtgärden just nu. Försök igen.',
}

export type InloggningsResultat =
  | { ok: true; session: Session; anvandare: Anvandare }
  | { ok: false; fel: InloggningsFel }

function isBrowser() {
  return typeof window !== 'undefined'
}

function giltigEpost(epost: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(epost)
}

function textFranMetadata(user: SupabaseUser, nycklar: string[]): string | null {
  for (const nyckel of nycklar) {
    const varde = user.user_metadata?.[nyckel]
    if (typeof varde === 'string' && varde.trim()) return varde.trim()
  }
  return null
}

function namnFranSupabaseAnvandare(user: SupabaseUser) {
  const epost = user.email ?? ''
  const lokalDel = epost.split('@')[0] || 'admin'
  return (
    textFranMetadata(user, ['full_name', 'name', 'display_name', 'namn']) ??
    lokalDel.replace(/[._-]+/g, ' ')
  )
}

/**
 * Kontrollerar ett lösenord mot Have I Been Pwned:s "Pwned Passwords"-API
 * via k-Anonymity-modellen: bara de första 5 tecknen av SHA-1-hashen skickas
 * över nätet, aldrig lösenordet självt eller den fullständiga hashen. Detta
 * är samma dataset och integritetsmodell som Supabase Auths egna
 * "leaked password protection" (en Pro-funktion) använder – vi anropar bara
 * samma publika, gratis API direkt istället för att gå via Supabase.
 *
 * Fail-open: nätverksfel eller ett icke-OK-svar blockerar ALDRIG
 * lösenordsbytet. Detta är ett tilläggslager ovanpå längdkravet, inte den
 * enda spärren – om HIBP är otillgängligt ska en admin ändå kunna sätta ett
 * lösenord som uppfyller längdkravet.
 */
async function losenordArLackt(losenord: string): Promise<boolean> {
  try {
    const kryptoApi = typeof crypto !== 'undefined' ? crypto : globalThis.crypto
    const data = new TextEncoder().encode(losenord)
    const hashBuffer = await kryptoApi.subtle.digest('SHA-1', data)
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()

    const prefix = hash.slice(0, 5)
    const suffix = hash.slice(5)

    const svar = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)
    if (!svar.ok) return false

    const text = await svar.text()
    return text.split('\n').some((rad) => rad.trim().split(':')[0] === suffix)
  } catch {
    return false
  }
}

function initialerFranNamn(namn: string) {
  return (
    namn
      .trim()
      .split(/\s+/)
      .map((del) => del[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  )
}

/**
 * ── Tillfällig mappning: Supabase-användare → portalens Anvandare ─────────
 *
 * Fält som kommer direkt från Supabase:
 *   - id     ← `user.id`
 *   - epost  ← `user.email`
 *
 * Fält som sätts till tillfälliga standardvärden (ingen personalmodell finns än):
 *   - roll      → `'administrator'`
 *   - namn      → hämtas från Supabase user_metadata om möjligt, annars e-postens lokal-del
 *   - initialer → härleds ur namnet
 *   - titel     → hämtas från Supabase user_metadata om möjligt, annars tydlig tillfällig text
 *   - aktiv     → alltid `true`
 *
 * VIKTIGT: Detta är inte en behörighetsmodell. Så fort riktiga roller/profiler
 * införs för ärende-/teknikertilldelning ska `roll` sluta vara ett hårdkodat
 * standardvärde för alla inloggade konton. Systembehörigheten hämtas redan
 * separat via `/api/roll` och `profiles`.
 */
function tillPortalAnvandare(user: SupabaseUser): Anvandare {
  const epost = user.email ?? ''
  const namn = namnFranSupabaseAnvandare(user)
  const titel =
    textFranMetadata(user, ['title', 'titel', 'job_title']) ??
    'Adminkonto (tillfällig personalmappning)'

  return {
    id: user.id,
    namn,
    epost,
    roll: arDemogastEpost(epost) ? 'tekniker' : 'administrator',
    initialer: initialerFranNamn(namn),
    titel,
    aktiv: true,
  }
}

function tillPortalSession(
  supabaseSession: SupabaseSession,
  anvandare: Anvandare,
  ihagkommen: boolean,
): Session {
  return {
    anvandareId: anvandare.id,
    epost: anvandare.epost,
    roll: anvandare.roll,
    upphorVid: supabaseSession.expires_at ? supabaseSession.expires_at * 1000 : null,
    ihagkommen,
  }
}

/**
 * Autentiseringsadapter. All kommunikation med Supabase Auth går via denna
 * adapter – resten av portalen känner bara till `useAuth()`.
 */
export const authAdapter = {
  async loggaIn(
    epost: string,
    losenord: string,
    ihagkommen: boolean,
  ): Promise<InloggningsResultat> {
    const normaliserad = epost.trim().toLowerCase()

    if (!normaliserad || !losenord) {
      return { ok: false, fel: 'saknade_uppgifter' }
    }
    if (!giltigEpost(normaliserad)) {
      return { ok: false, fel: 'ogiltig_epost' }
    }

    const supabase = skapaSupabaseWebblasarklient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normaliserad,
      password: losenord,
    })

    if (error || !data.session || !data.user) {
      return { ok: false, fel: 'fel_uppgifter' }
    }

    if (ihagkommen) {
      sparaIhagkommenEpost(normaliserad)
    } else {
      rensaIhagkommenEpost()
    }

    const anvandare = tillPortalAnvandare(data.user)
    return {
      ok: true,
      session: tillPortalSession(data.session, anvandare, ihagkommen),
      anvandare,
    }
  },

  /**
   * Loggar ut via Supabase. Returnerar `{ ok: false }` om `signOut()`
   * misslyckas (t.ex. nätverksfel), så att `AuthProvider` inte låtsas att
   * utloggningen lyckades och inte rensar sessionen i onödan.
   */
  async loggaUt(): Promise<{ ok: boolean }> {
    const supabase = skapaSupabaseWebblasarklient()
    const { error } = await supabase.auth.signOut()
    return { ok: !error }
  },

  /** Rensar bara den här webbläsarens session när servern har löpt ut leasen. */
  async loggaUtLokalt(): Promise<void> {
    const supabase = skapaSupabaseWebblasarklient()
    await supabase.auth.signOut({ scope: 'local' })
  },

  /**
   * Läser den aktuella Supabase-sessionen (om någon).
   */
  async hamtaSession(): Promise<{ session: Session; anvandare: Anvandare } | null> {
    const supabase = skapaSupabaseWebblasarklient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) return null

    const anvandare = tillPortalAnvandare(session.user)
    return {
      session: tillPortalSession(session, anvandare, hamtaIhagkommenEpost() === anvandare.epost),
      anvandare,
    }
  },

  /**
   * Lyssnar på förändringar i Supabase-sessionen (utloggning i en annan
   * flik, tokenuppdatering, utgången session, eller att MFA-verifiering
   * just slutfördes – se `AuthChangeEventNamn`). Returnerar en
   * avregistreringsfunktion som `AuthProvider` anropar vid unmount.
   */
  lyssnaPaSessionsandringar(
    callback: (
      varde: { session: Session; anvandare: Anvandare } | null,
      handelse: AuthChangeEventNamn,
    ) => void,
  ): () => void {
    const supabase = skapaSupabaseWebblasarklient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((handelse, session) => {
      if (!session?.user) {
        callback(null, handelse)
        return
      }
      const anvandare = tillPortalAnvandare(session.user)
      callback(
        {
          session: tillPortalSession(session, anvandare, hamtaIhagkommenEpost() === anvandare.epost),
          anvandare,
        },
        handelse,
      )
    })
    return () => subscription.unsubscribe()
  },

  async begarAterstallning(epost: string): Promise<{ ok: boolean; fel?: InloggningsFel }> {
    const normaliserad = epost.trim().toLowerCase()
    if (!normaliserad) return { ok: false, fel: 'saknade_uppgifter' }
    if (!giltigEpost(normaliserad)) return { ok: false, fel: 'ogiltig_epost' }

    const supabase = skapaSupabaseWebblasarklient()
    const redirectTo = isBrowser()
      ? `${window.location.origin}/logga-in?aterstall=1`
      : undefined
    const { error } = await supabase.auth.resetPasswordForEmail(normaliserad, { redirectTo })

    if (error) return { ok: false, fel: 'serverfel' }
    // Supabase avslöjar inte om adressen finns, vilket är vad vi vill.
    return { ok: true }
  },

  async uppdateraLosenord(losenord: string): Promise<{ ok: boolean; fel?: InloggningsFel }> {
    if (!losenord) return { ok: false, fel: 'saknade_uppgifter' }
    if (losenord.length < 8) return { ok: false, fel: 'svagt_losenord' }
    if (await losenordArLackt(losenord)) return { ok: false, fel: 'lackt_losenord' }

    const supabase = skapaSupabaseWebblasarklient()
    const { error } = await supabase.auth.updateUser({ password: losenord })
    if (error) return { ok: false, fel: 'serverfel' }

    await supabase.auth.signOut()
    return { ok: true }
  },
}

export function sparaIhagkommenEpost(epost: string) {
  if (!isBrowser()) return
  window.localStorage.setItem(IHAGKOMMEN_NYCKEL, epost)
}

export function rensaIhagkommenEpost() {
  if (!isBrowser()) return
  window.localStorage.removeItem(IHAGKOMMEN_NYCKEL)
}

export function hamtaIhagkommenEpost(): string | null {
  if (!isBrowser()) return null
  return window.localStorage.getItem(IHAGKOMMEN_NYCKEL)
}

/**
 * Behörigheter per portalroll. Centraliserat så att navigation, sidskydd och
 * enskilda knappar utgår från samma sanning.
 */
export const behorigheter = {
  administrator: [
    'se_alla_arenden',
    'skapa_arende',
    'andra_status',
    'andra_prioritet',
    'tilldela_arende',
    'svara_kund',
    'intern_anteckning',
    'hantera_bokningar',
    'se_kunder',
    'redigera_kund',
    'se_installningar',
    'hantera_anvandare',
    'hantera_systeminstallningar',
  ],
  tekniker: [
    'se_alla_arenden',
    'skapa_arende',
    'andra_status',
    'andra_prioritet',
    'svara_kund',
    'intern_anteckning',
    'hantera_bokningar',
    'se_kunder',
  ],
} as const

export type Behorighet = (typeof behorigheter)['administrator'][number]

export function harBehorighet(roll: Roll, behorighet: Behorighet): boolean {
  return (behorigheter[roll] as readonly string[]).includes(behorighet)
}
