import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

/**
 * Postgres beviljar EXECUTE på nya funktioner till pseudo-rollen PUBLIC som
 * standard – `revoke ... from anon, authenticated` räcker INTE, eftersom
 * anon/authenticated ändå ärver EXECUTE via PUBLIC om PUBLIC självt inte
 * återkallas separat (se 20260728163320:s egen kommentar, som dokumenterar
 * att detta upptäcktes live via information_schema.routine_privileges).
 *
 * `20260728153518_harden_profiles_rls.sql` (som redan har egna tester i
 * harden-profiles-rls.test.ts) applicerades ALDRIG som en egen post i
 * Supabases migrationshistorik – dess innehåll applicerades i praktiken via
 * 20260728163320, som även lade till PUBLIC-revoke-satserna. Den filen –
 * den som faktiskt är live – saknade helt testtäckning innan detta test,
 * vilket gav falsk trygghet: skyddet såg testat ut, men det faktiskt
 * applicerade skyddet (PUBLIC-delen) hade inget skydd mot regression.
 */

function lasMigration(filnamn: string): string {
  return readFileSync(fileURLToPath(new URL(`./${filnamn}`, import.meta.url)), 'utf8').toLowerCase()
}

describe('harden profiles rls och revoke public execute (den faktiskt applicerade migrationen)', () => {
  const sql = lasMigration('20260728163320_harden_profiles_rls_and_revoke_public_execute.sql')

  it('återkallar PUBLIC-EXECUTE på hantera_ny_anvandare (SECURITY DEFINER-triggerfunktionen)', () => {
    expect(sql).toContain('revoke execute on function public.hantera_ny_anvandare () from public;')
  })

  it('återkallar PUBLIC-EXECUTE på timestamp-triggerfunktionen', () => {
    expect(sql).toContain(
      'revoke execute on function public.satt_profil_uppdaterad_tidsstampel () from public;',
    )
  })

  it('behåller anon/authenticated-revoken och RLS på profiles', () => {
    expect(sql).toContain('alter table public.profiles enable row level security;')
    expect(sql).toContain('revoke all on public.profiles from anon, authenticated;')
  })

  it('fixerar search_path på timestamp-funktionen', () => {
    expect(sql).toContain('set search_path = public')
  })
})

describe('revoke public execute – admin_operativa_tabeller-triggerfunktionen', () => {
  const sql = lasMigration('20260728165548_revoke_public_execute_admin_operativa_functions.sql')

  it('återkallar PUBLIC-EXECUTE på admin-tabellernas timestamp-triggerfunktion', () => {
    expect(sql).toContain('revoke execute on function public.satt_admin_uppdaterad_tidsstampel () from public;')
  })
})

describe('admin_arendenummer_sekvens – RPC-funktionen och sekvensen är låsta', () => {
  const sql = lasMigration('20260728165341_admin_arendenummer_sekvens.sql')

  it('sätter search_path på nasta_admin_arendenummer()', () => {
    expect(sql).toContain('set search_path = public')
  })

  it('återkallar EXECUTE från anon/authenticated OCH PUBLIC på funktionen', () => {
    expect(sql).toContain('revoke all on function public.nasta_admin_arendenummer () from anon, authenticated;')
    expect(sql).toContain('revoke execute on function public.nasta_admin_arendenummer () from public;')
  })

  it('återkallar åtkomst till den underliggande sekvensen från anon/authenticated/public', () => {
    expect(sql).toContain(
      'revoke all on sequence public.admin_arendenummer_seq from anon, authenticated, public;',
    )
  })

  it('använder inte SECURITY DEFINER', () => {
    expect(sql).not.toContain('security definer')
  })
})
