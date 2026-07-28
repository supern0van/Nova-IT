import { describe, expect, it, vi } from 'vitest'

import {
  checkOperationsDatabase,
  operationsTables,
  parseEnvText,
} from './check-operations-database.mjs'

describe('check-operations-database', () => {
  it('läser enkla env-filer utan att kräva secret-utskrift', () => {
    expect(
      parseEnvText(`
        # kommentar
        NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
        SUPABASE_SERVICE_ROLE_KEY="secret=value"
      `),
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'secret=value',
    })
  })

  it('failar stängt om service-env saknas', async () => {
    await expect(
      checkOperationsDatabase({
        env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co' },
      }),
    ).resolves.toEqual({
      ok: false,
      missingEnv: ['SUPABASE_SERVICE_ROLE_KEY'],
      readableTables: [],
      unreadableTables: operationsTables,
    })
  })

  it('godkänner när alla operativa tabeller kan läsas', async () => {
    const select = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn(() => ({ select }))
    const clientFactory = vi.fn(() => ({ from }))

    await expect(
      checkOperationsDatabase({
        env: {
          NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
          SUPABASE_SERVICE_ROLE_KEY: 'service-role',
        },
        clientFactory,
      }),
    ).resolves.toEqual({
      ok: true,
      missingEnv: [],
      readableTables: operationsTables,
      unreadableTables: [],
    })

    expect(from).toHaveBeenCalledTimes(operationsTables.length)
    expect(select).toHaveBeenCalledWith('id', { count: 'exact', head: true })
  })

  it('rapporterar tabeller som inte kan läsas', async () => {
    const from = vi.fn((table: string) => ({
      select: vi.fn().mockResolvedValue({
        error: table === 'admin_bokningar' ? new Error('saknas') : null,
      }),
    }))
    const clientFactory = vi.fn(() => ({ from }))

    await expect(
      checkOperationsDatabase({
        env: {
          NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
          SUPABASE_SERVICE_ROLE_KEY: 'service-role',
        },
        clientFactory,
      }),
    ).resolves.toEqual({
      ok: false,
      missingEnv: [],
      readableTables: operationsTables.filter((table) => table !== 'admin_bokningar'),
      unreadableTables: ['admin_bokningar'],
    })
  })
})
