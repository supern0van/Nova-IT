/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  MFA – klientadapter mot Supabase Auth MFA/TOTP                       ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Enda platsen i portalen som anropar `supabase.auth.mfa.*` direkt. Precis
 * som `lib/auth/demo-auth.ts` är gränssnittet för inloggning, är den här
 * modulen gränssnittet för MFA – `components/auth/mfa-vy.tsx` och
 * `components/portal/sakerhet/sakerhet-vy.tsx` känner bara till dessa
 * funktioner, inte Supabase-klienten direkt.
 *
 * Bygger uteslutande på Supabases officiella MFA-API (ingen egen
 * TOTP-implementation):
 * https://supabase.com/docs/guides/auth/auth-mfa/totp
 * https://supabase.com/docs/reference/javascript/auth-mfa-api
 *
 * Varje funktion tar emot en `SupabaseClient` som parameter (istället för
 * att skapa en egen) så att:
 *   1. anroparen bestämmer vilken klient som används (alltid
 *      `skapaSupabaseWebblasarklient()` i praktiken, se `lib/supabase/client.ts`), och
 *   2. funktionerna går att enhetstesta med en uppmockad klient, utan
 *      nätverk eller riktigt Supabase-projekt.
 *
 * TOTP-hemligheter (QR-kod, `secret`) returneras bara till anroparen för att
 * visas för användaren en gång under enrollment – de lagras ALDRIG av denna
 * modul, och absolut inte i `public.profiles` (Supabase Auth äger och lagrar
 * dem själv, i sitt eget skyddade schema).
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface EnrollmentStart {
  ok: true
  factorId: string
  /** SVG-QR-kod som en data-URL (`data:image/svg+xml;utf-8,...`). */
  qrKodDataUrl: string
  /** Hemligheten i klartext, för manuell inmatning om QR-koden inte går att skanna. */
  hemlighetForManuellInmatning: string
}

export interface MfaFelResultat {
  ok: false
  fel: string
}

export type TotpFaktor = {
  id: string
  vanligtNamn?: string
  status: 'verified' | 'unverified'
  skapad: string
}

/**
 * Visningsnamn för en TOTP-faktor i UI:t (t.ex. faktorväljaren vid
 * inloggning, eller enhetslistan under `/portal/sakerhet`). Använder
 * `friendly_name` om enrollment satte ett (se `paborjaEnrollment()`),
 * annars ett förutsägbart, numrerat reservnamn – ALDRIG ett tomt namn,
 * eftersom flera faktorer annars inte går att skilja åt.
 */
export function visningsnamnForFaktor(faktor: TotpFaktor, index: number): string {
  if (faktor.vanligtNamn && faktor.vanligtNamn.trim().length > 0) {
    return faktor.vanligtNamn.trim()
  }
  return `Autentiseringsapp ${index + 1}`
}

/**
 * Översätter Supabase Auth-felmeddelanden (alltid på engelska från API:et)
 * till svensk UI-text. Faller tillbaka till ett generiskt meddelande för
 * fel vi inte känner igen, istället för att läcka rå engelsk API-text.
 */
export function oversattMfaFel(meddelande: string | null | undefined): string {
  const m = (meddelande ?? '').toLowerCase()

  if (m.includes('invalid') && m.includes('totp')) {
    return 'Fel kod. Kontrollera att klockan i din autentiseringsapp är rätt inställd och försök igen.'
  }
  if (m.includes('invalid') && m.includes('code')) {
    return 'Fel kod. Försök igen.'
  }
  if (m.includes('expired')) {
    return 'Koden hann gå ut. Ange en ny kod från din autentiseringsapp.'
  }
  if (m.includes('already') && m.includes('verified')) {
    return 'Den här enheten är redan verifierad.'
  }
  if (m.includes('too many') || m.includes('rate limit')) {
    return 'För många försök. Vänta en stund och försök igen.'
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Kunde inte nå servern. Kontrollera din internetanslutning och försök igen.'
  }
  return 'Något gick fel. Försök igen, eller logga ut och in på nytt.'
}

/**
 * Steg 1 av enrollment: skapar en ny (overifierad) TOTP-faktor och returnerar
 * en QR-kod och en hemlighet för manuell inmatning.
 *
 * `friendlyName` bör alltid sättas till något användbart – särskilt viktigt
 * när en BACKUP-enhet läggs till (se `sakerhet-vy.tsx`), eftersom
 * `listaTotpFaktorer()` annars inte går att skilja åt i UI:t när en
 * användare har flera verifierade faktorer (se `visningsnamnForFaktor()`
 * nedan för fallback när namnet saknas).
 */
export async function paborjaEnrollment(
  supabase: SupabaseClient,
  friendlyName?: string,
): Promise<EnrollmentStart | MfaFelResultat> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    ...(friendlyName ? { friendlyName } : {}),
  })
  if (error || !data) {
    return { ok: false, fel: oversattMfaFel(error?.message) }
  }
  return {
    ok: true,
    factorId: data.id,
    qrKodDataUrl: data.totp.qr_code,
    hemlighetForManuellInmatning: data.totp.secret,
  }
}

/**
 * Steg 2–3 av enrollment (eller inloggningens verifieringssteg): skapar en
 * utmaning (`challenge`) för faktorn och verifierar koden användaren angav.
 * Vid lyckad verifiering uppgraderar Supabase Auth själv sessionen till
 * `aal2` och uppdaterar klientens session i bakgrunden.
 */
export async function utmanaOchVerifieraKod(
  supabase: SupabaseClient,
  factorId: string,
  kod: string,
): Promise<{ ok: true } | MfaFelResultat> {
  const utmaning = await supabase.auth.mfa.challenge({ factorId })
  if (utmaning.error || !utmaning.data) {
    return { ok: false, fel: oversattMfaFel(utmaning.error?.message) }
  }

  const verifiering = await supabase.auth.mfa.verify({
    factorId,
    challengeId: utmaning.data.id,
    code: kod,
  })
  if (verifiering.error) {
    return { ok: false, fel: oversattMfaFel(verifiering.error.message) }
  }

  return { ok: true }
}

/**
 * Avbryter en pågående (overifierad) enrollment genom att avregistrera
 * (`unenroll`) faktorn – oavsett om användaren aktivt klickade "Avbryt",
 * eller om vyn stängdes/avmonterades på annat sätt innan verifieringen
 * slutfördes (se anropsställena i `mfa-vy.tsx` och `sakerhet-vy.tsx`, som
 * båda städar via denna funktion även vid oväntad avmontering).
 *
 * Kräver INTE `aal2` – till skillnad från att avregistrera en redan
 * verifierad faktor, se `avregistreraFaktor()` – eftersom en overifierad
 * faktor per definition skapades av en session som ännu bara är `aal1`.
 *
 * Till skillnad från en tidigare version av denna funktion SVÄLJER den
 * INTE längre fel tyst: ett misslyckat städningsförsök måste kunna visas
 * för användaren (annars kan overifierade skräpfaktorer bli kvar utan att
 * någon märker det).
 */
export async function avbrytEnrollment(
  supabase: SupabaseClient,
  factorId: string,
): Promise<{ ok: true } | MfaFelResultat> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) {
    return {
      ok: false,
      fel: `Kunde inte städa bort den overifierade enheten automatiskt (${oversattMfaFel(error.message)}).`,
    }
  }
  return { ok: true }
}

/**
 * Avregistrerar en faktor permanent (hantering under Inställningar →
 * Säkerhet). Kräver enligt Supabase att sessionen redan är `aal2` om
 * faktorn är verifierad – vilket alltid är fallet i den här portalen, då
 * `/portal/*` aldrig nås utan `aal2` (se `lib/supabase/proxy.ts`).
 */
export async function avregistreraFaktor(
  supabase: SupabaseClient,
  factorId: string,
): Promise<{ ok: true } | MfaFelResultat> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) return { ok: false, fel: oversattMfaFel(error.message) }
  return { ok: true }
}

/** Alla TOTP-faktorer (verifierade och overifierade) för den inloggade användaren. */
export async function listaTotpFaktorer(
  supabase: SupabaseClient,
): Promise<TotpFaktor[] | MfaFelResultat> {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error || !data) {
    return { ok: false, fel: oversattMfaFel(error?.message) }
  }
  return data.totp.map((f) => ({
    id: f.id,
    vanligtNamn: f.friendly_name,
    status: f.status,
    skapad: f.created_at,
  }))
}

/**
 * Nuvarande och nästa authenticator assurance level för klientens session.
 * Snabb (mikrosekunder) – rör i praktiken inte nätverket, enligt Supabase
 * dokumentation. Används för att avgöra om `/mfa`-sidan ska visa
 * enrollment- eller verifieringsvyn.
 */
export async function hamtaAssuransniva(supabase: SupabaseClient): Promise<{
  currentLevel: string | null
  nextLevel: string | null
} | null> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error || !data) return null
  return { currentLevel: data.currentLevel, nextLevel: data.nextLevel }
}
