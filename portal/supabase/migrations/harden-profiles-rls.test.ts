import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260728153518_harden_profiles_rls.sql'),
  'utf8',
).toLowerCase()

describe('harden profiles rls migration', () => {
  it('aktiverar RLS på profiles som defense-in-depth', () => {
    expect(sql).toContain('alter table public.profiles enable row level security;')
  })

  it('behåller profiles och timestamp-funktionen oåtkomliga för anon/authenticated', () => {
    expect(sql).toContain('revoke all on public.profiles from anon, authenticated;')
    expect(sql).toContain(
      'revoke all on function public.satt_profil_uppdaterad_tidsstampel () from anon, authenticated;',
    )
  })

  it('fixerar search_path på timestamp-funktionen', () => {
    expect(sql).toContain('set search_path = public')
  })
})
