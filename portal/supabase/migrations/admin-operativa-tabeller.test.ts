import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const migrationPath = fileURLToPath(
  new URL('./20260728150105_admin_operativa_tabeller.sql', import.meta.url),
)

const sql = readFileSync(migrationPath, 'utf8')

const operativaTabeller = [
  'admin_kunder',
  'admin_arenden',
  'admin_meddelanden',
  'admin_aktiviteter',
  'admin_bokningar',
  'admin_kundanteckningar',
]

describe('admin operativa tabeller migration', () => {
  it('skapar de operativa tabellerna med RLS påslaget', () => {
    for (const tabell of operativaTabeller) {
      expect(sql).toContain(`create table public.${tabell}`)
      expect(sql).toContain(`alter table public.${tabell} enable row level security;`)
    }
  })

  it('nekar direkt klientåtkomst till operativa tabeller', () => {
    for (const tabell of operativaTabeller) {
      expect(sql).toContain(`revoke all on public.${tabell} from anon, authenticated;`)
    }
  })

  it('använder inte SECURITY DEFINER i operativa migrationen', () => {
    expect(sql.toLowerCase()).not.toContain('security definer')
  })
})
