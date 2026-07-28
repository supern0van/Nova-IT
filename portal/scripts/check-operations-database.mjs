import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { createClient } from '@supabase/supabase-js'

export const operationsTables = [
  'admin_kunder',
  'admin_arenden',
  'admin_meddelanden',
  'admin_aktiviteter',
  'admin_bokningar',
  'admin_kundanteckningar',
]

/**
 * @typedef {{ error?: unknown }} OperationsHeadResult
 * @typedef {{ select: (columns: string, options: { count: 'exact', head: true }) => Promise<OperationsHeadResult> }} OperationsTableQuery
 * @typedef {{ from: (table: string) => OperationsTableQuery }} OperationsSupabaseClient
 * @typedef {(url: string, key: string, options: { auth: { autoRefreshToken: boolean, persistSession: boolean } }) => OperationsSupabaseClient} OperationsClientFactory
 */

/**
 * @param {string} text
 * @returns {Record<string, string>}
 */
export function parseEnvText(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const [key, ...rest] = line.split('=')
        return [key.trim(), rest.join('=').trim().replace(/^["']|["']$/g, '')]
      })
      .filter(([key]) => key),
  )
}

/**
 * @param {string} cwd
 * @returns {Promise<Record<string, string>>}
 */
export async function readLocalEnv(cwd = process.cwd()) {
  const env = {}

  for (const name of ['.env', '.env.local']) {
    const file = join(cwd, name)
    if (existsSync(file)) {
      Object.assign(env, parseEnvText(await readFile(file, 'utf8')))
    }
  }

  return { ...env, ...process.env }
}

/**
 * @param {{
 *   env?: Record<string, string | undefined>,
 *   clientFactory?: OperationsClientFactory,
 *   tables?: string[],
 * }} [options]
 * @returns {Promise<{ ok: boolean, missingEnv: string[], readableTables: string[], unreadableTables: string[] }>}
 */
export async function checkOperationsDatabase({
  env,
  clientFactory = /** @type {OperationsClientFactory} */ (createClient),
  tables = operationsTables,
} = {}) {
  const resolvedEnv = env ?? (await readLocalEnv())
  const requiredEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  const missingEnv = requiredEnv.filter((key) => !resolvedEnv[key]?.trim())

  if (missingEnv.length > 0) {
    return { ok: false, missingEnv, readableTables: [], unreadableTables: tables }
  }

  const supabase = clientFactory(
    resolvedEnv.NEXT_PUBLIC_SUPABASE_URL,
    resolvedEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )

  const results = await Promise.all(
    tables.map(async (table) => {
      try {
        const { error } = await supabase
          .from(table)
          .select('id', { count: 'exact', head: true })

        return [table, !error]
      } catch {
        return [table, false]
      }
    }),
  )

  const readableTables = results
    .filter(([, readable]) => readable)
    .map(([table]) => table)
  const unreadableTables = results
    .filter(([, readable]) => !readable)
    .map(([table]) => table)

  return {
    ok: missingEnv.length === 0 && unreadableTables.length === 0,
    missingEnv,
    readableTables,
    unreadableTables,
  }
}

export async function main() {
  const result = await checkOperationsDatabase()

  if (result.missingEnv.length > 0) {
    console.error(`✗ Saknar miljövariabler: ${result.missingEnv.join(', ')}`)
    return 1
  }

  if (result.unreadableTables.length > 0) {
    console.error(
      `✗ Operativa Supabase-tabeller saknas eller kan inte läsas: ${result.unreadableTables.join(', ')}`,
    )
    console.error('  Kör migrationen 20260728150105_admin_operativa_tabeller.sql innan UI:t kopplas om.')
    return 1
  }

  console.log(`✓ Operativa Supabase-tabeller kan läsas: ${result.readableTables.join(', ')}`)
  return 0
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    process.exitCode = await main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
