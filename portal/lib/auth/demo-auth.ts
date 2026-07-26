/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  DEMOAUTENTISERING – ERSÄTTS I PRODUKTION                                ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Denna modul är den ENDA platsen i portalen som vet hur inloggning fungerar.
 * Allt annat i applikationen använder `useAuth()` från
 * `components/auth/auth-provider.tsx`, som i sin tur anropar detta gränssnitt.
 *
 * Lösenord jämförs i klartext och sessionen ligger i localStorage. Detta är
 * medvetet och endast avsett för demonstration – det ger INGET säkerhetsskydd.
 *
 * ── Vid övergång till riktig autentisering ────────────────────────────────
 * Byt ut implementationen av `authAdapter` nedan mot ett anrop till valfri
 * leverantör. Signaturerna behöver inte ändras:
 *
 *   Supabase Auth:
 *     loggaIn  → supabase.auth.signInWithPassword({ email, password })
 *     loggaUt  → supabase.auth.signOut()
 *     hamtaSession → supabase.auth.getSession()
 *
 *   Clerk:
 *     loggaIn  → signIn.create({ identifier, password })
 *     hamtaSession → useSession()
 *
 *   Egen backend (Better Auth / NextAuth):
 *     loggaIn  → POST /api/auth/sign-in  (sätter httpOnly-cookie)
 *     hamtaSession → GET /api/auth/session
 *
 * Sessionen bör då flyttas från localStorage till en httpOnly-cookie och
 * sidskyddet i `components/auth/skyddad-route.tsx` kompletteras med kontroll
 * i middleware/proxy så att skyddet sker på servern.
 */

import { demoAnvandare } from '@/lib/demo-data'
import type { Anvandare, Roll } from '@/lib/types'

const SESSION_NYCKEL = 'nova-it.demo-session'
const IHAGKOMMEN_NYCKEL = 'nova-it.demo-ihagkommen-epost'

/** Sessionslängd. Kort när "kom ihåg mig" inte är valt. */
const SESSION_TIMMAR_STANDARD = 8
const SESSION_TIMMAR_IHAGKOMMEN = 24 * 30

/** Lösenord för demokontona. Finns självklart inte i en riktig lösning. */
const DEMO_LOSENORD: Record<string, string> = {
  'admin@nova-it.se': 'Demo123!',
  'tekniker@nova-it.se': 'Demo123!',
  'sofia@nova-it.se': 'Demo123!',
}

export interface Session {
  anvandareId: string
  epost: string
  roll: Roll
  /** Unix-tidsstämpel (ms) när sessionen upphör. */
  upphorVid: number
  skapadVid: number
  ihagkommen: boolean
}

export type InloggningsFel =
  | 'saknade_uppgifter'
  | 'ogiltig_epost'
  | 'fel_uppgifter'
  | 'konto_inaktivt'

export const felmeddelanden: Record<InloggningsFel, string> = {
  saknade_uppgifter: 'Fyll i både e-postadress och lösenord.',
  ogiltig_epost: 'Ange en giltig e-postadress.',
  fel_uppgifter: 'Fel e-postadress eller lösenord. Kontrollera uppgifterna och försök igen.',
  konto_inaktivt: 'Kontot är inaktiverat. Kontakta en administratör för att få det aktiverat.',
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

/**
 * Autentiseringsadapter. Byt ut innehållet i dessa funktioner för att koppla
 * på riktig autentisering – resten av portalen behöver inte ändras.
 */
export const authAdapter = {
  /** Simulerad nätverkslatens så att laddningslägen syns i demon. */
  async loggaIn(
    epost: string,
    losenord: string,
    ihagkommen: boolean,
  ): Promise<InloggningsResultat> {
    await new Promise((r) => setTimeout(r, 850))

    const normaliserad = epost.trim().toLowerCase()

    if (!normaliserad || !losenord) {
      return { ok: false, fel: 'saknade_uppgifter' }
    }
    if (!giltigEpost(normaliserad)) {
      return { ok: false, fel: 'ogiltig_epost' }
    }

    const anvandare = demoAnvandare.find((a) => a.epost.toLowerCase() === normaliserad)

    if (!anvandare || DEMO_LOSENORD[normaliserad] !== losenord) {
      return { ok: false, fel: 'fel_uppgifter' }
    }
    if (!anvandare.aktiv) {
      return { ok: false, fel: 'konto_inaktivt' }
    }

    const timmar = ihagkommen ? SESSION_TIMMAR_IHAGKOMMEN : SESSION_TIMMAR_STANDARD
    const session: Session = {
      anvandareId: anvandare.id,
      epost: anvandare.epost,
      roll: anvandare.roll,
      skapadVid: Date.now(),
      upphorVid: Date.now() + timmar * 3600_000,
      ihagkommen,
    }

    sparaSession(session)
    if (ihagkommen) {
      sparaIhagkommenEpost(anvandare.epost)
    } else {
      rensaIhagkommenEpost()
    }

    return { ok: true, session, anvandare }
  },

  async loggaUt(): Promise<void> {
    await new Promise((r) => setTimeout(r, 250))
    if (isBrowser()) window.localStorage.removeItem(SESSION_NYCKEL)
  },

  /** Läser session och kastar den om den har gått ut. */
  hamtaSession(): Session | null {
    if (!isBrowser()) return null
    try {
      const rå = window.localStorage.getItem(SESSION_NYCKEL)
      if (!rå) return null
      const session = JSON.parse(rå) as Session
      if (!session?.anvandareId || typeof session.upphorVid !== 'number') return null
      if (Date.now() > session.upphorVid) {
        window.localStorage.removeItem(SESSION_NYCKEL)
        return null
      }
      return session
    } catch {
      return null
    }
  },

  /** Demoåterställning av lösenord – skickar inget riktigt mejl. */
  async begarAterstallning(epost: string): Promise<{ ok: boolean; fel?: InloggningsFel }> {
    await new Promise((r) => setTimeout(r, 900))
    const normaliserad = epost.trim().toLowerCase()
    if (!normaliserad) return { ok: false, fel: 'saknade_uppgifter' }
    if (!giltigEpost(normaliserad)) return { ok: false, fel: 'ogiltig_epost' }
    // Svarar alltid positivt: avslöjar inte vilka adresser som finns.
    return { ok: true }
  },
}

function sparaSession(session: Session) {
  if (!isBrowser()) return
  window.localStorage.setItem(SESSION_NYCKEL, JSON.stringify(session))
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

export function hamtaAnvandare(id: string): Anvandare | undefined {
  return demoAnvandare.find((a) => a.id === id)
}

/** Personallista. Ersätts av en users-tabell i produktion. */
export function listaAnvandare(): Anvandare[] {
  return demoAnvandare
}

/** Aktiv personal som kan tilldelas ärenden och bokningar. */
export function listaTilldelningsbara(): Anvandare[] {
  return demoAnvandare.filter((a) => a.aktiv)
}

export function anvandarNamn(id: string | null | undefined): string {
  if (!id) return 'Ej tilldelad'
  return demoAnvandare.find((a) => a.id === id)?.namn ?? 'Okänd användare'
}

export function anvandarInitialer(id: string | null | undefined): string {
  if (!id) return '–'
  return demoAnvandare.find((a) => a.id === id)?.initialer ?? '?'
}

// ─── Behörighetsstyrning ────────────────────────────────────────────────────

/**
 * Behörigheter per roll. Centraliserat så att både navigation, sidskydd och
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
