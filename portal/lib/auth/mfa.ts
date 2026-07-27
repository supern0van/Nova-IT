/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  MFA – delade typer och rena hjälpfunktioner                          ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Obligatorisk MFA/TOTP via Supabase Auth. Denna fil innehåller MEDVETET
 * endast typer och rena, synkrona hjälpfunktioner – ingen databas- eller
 * Supabase-åtkomst – så att den fritt kan importeras från både klient- och
 * serverkod (t.ex. `lib/supabase/proxy.ts`, `lib/supabase/route-anvandare.ts`
 * och `components/auth/mfa-vy.tsx`).
 *
 * VIKTIGT – blanda inte ihop med `SystemRoll` (se `lib/auth/roll.ts`):
 * `SystemRoll` styr VAD en inloggad användare får göra i systemet.
 * Authenticator Assurance Level (AAL) styr OM sessionen överhuvudtaget är
 * tillräckligt starkt verifierad (dvs. att MFA är genomförd) för att
 * användas. De två är helt oberoende av varandra – en `administrator` och
 * en `medarbetare` genomgår exakt samma obligatoriska MFA-krav.
 *
 * Bakgrund (Supabase Auth MFA):
 * https://supabase.com/docs/guides/auth/auth-mfa
 * https://supabase.com/docs/guides/auth/auth-mfa/totp
 *
 * Assurance-nivån kodas i `aal`-claimet i JWT:t. En JWT utan `aal`-claim
 * räknas som `aal1`. `aal2` innebär att sessionen även verifierats med en
 * andra faktor (i denna portal: TOTP).
 */

export type AutentiseringsNiva = 'aal1' | 'aal2'

/** Sidan där hela MFA-flödet (enrollment + verifiering) bor. */
export const MFA_VAG = '/mfa'

/**
 * `true` om assurance-nivån är den högsta portalen kräver (`aal2`).
 * Nivåer utanför `'aal1' | 'aal2'` (t.ex. framtida Supabase-nivåer) räknas
 * medvetet INTE som `aal2` – faller stängt istället för öppet.
 */
export function harUppnattAal2(niva: string | null | undefined): boolean {
  return niva === 'aal2'
}
