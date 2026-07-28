import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  adminWorkerDomäner,
  adminWorkerNamn,
  obligatoriskaWorkerSecrets,
} from '@/lib/admin/worker-konfiguration'

const select = vi.fn()
const from = vi.fn(() => ({ select }))
const listUsers = vi.fn()
const skapaSupabaseServiceklient = vi.fn(() => ({
  auth: { admin: { listUsers } },
  from,
}))

vi.mock('@/lib/supabase/service', () => ({ skapaSupabaseServiceklient }))

let hamtaSystemStatus: typeof import('@/lib/admin/system-status-server').hamtaSystemStatus

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
  listUsers.mockResolvedValue({ data: { users: [] }, error: null })
  ;({ hamtaSystemStatus } = await import('@/lib/admin/system-status-server'))
})

describe('hamtaSystemStatus', () => {
  it('rapporterar ok när miljö och profiles-läsning fungerar', async () => {
    select.mockResolvedValue({ count: 3, error: null })

    const status = await hamtaSystemStatus()

    expect(status.profiler).toEqual({ antal: 3, status: 'ok' })
    expect(
      status.kontroller
        .filter((kontroll) => !kontroll.id.startsWith('settings-'))
        .every((kontroll) => kontroll.status === 'ok'),
    ).toBe(true)
    expect(status.kontroller).toContainEqual({
      id: 'settings-recipients-storage',
      namn: 'E-postmottagare',
      status: 'varning',
      beskrivning: 'Mottagarlistan är inte driftkopplad ännu och kan därför inte ändras i portalen.',
    })
    expect(status.kontroller).toContainEqual({
      id: 'auth-admin-read',
      namn: 'Supabase Auth Admin',
      status: 'ok',
      beskrivning: 'Worker:n kan läsa Auth-användare och bjuda in portalkonton server-side.',
    })
    expect(status.kontroller).toContainEqual({
      id: 'worker-name',
      namn: 'Cloudflare Worker',
      status: 'ok',
      beskrivning: 'Källkonfigurationen pekar på Worker:n nova-it-admin.',
    })
    expect(from).toHaveBeenCalledWith('profiles')
    expect(listUsers).toHaveBeenCalledWith({ page: 1, perPage: 1 })
  })

  it('rapporterar fel utan att skapa serviceklient om en obligatorisk secret saknas', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const status = await hamtaSystemStatus()

    expect(status.profiler).toEqual({ antal: null, status: 'fel' })
    expect(status.kontroller).toContainEqual({
      id: 'SUPABASE_SERVICE_ROLE_KEY',
      namn: 'Supabase service role',
      status: 'fel',
      beskrivning: 'SUPABASE_SERVICE_ROLE_KEY saknas i Worker-miljön.',
    })
    expect(status.kontroller.some((kontroll) => kontroll.id.startsWith('settings-'))).toBe(true)
    expect(skapaSupabaseServiceklient).not.toHaveBeenCalled()
  })

  it('rapporterar fel om profiles-tabellen inte kan läsas', async () => {
    select.mockResolvedValue({ count: null, error: new Error('nekad') })

    const status = await hamtaSystemStatus()

    expect(status.profiler).toEqual({ antal: null, status: 'fel' })
    expect(status.kontroller).toContainEqual({
      id: 'profiles-read',
      namn: 'Profiles-tabellen',
      status: 'fel',
      beskrivning: 'Worker:n kunde inte läsa profiles-tabellen via service role.',
    })
  })

  it('rapporterar fel om Auth Admin-API:t inte kan läsas', async () => {
    select.mockResolvedValue({ count: 3, error: null })
    listUsers.mockResolvedValue({ data: { users: [] }, error: new Error('auth nekad') })

    const status = await hamtaSystemStatus()

    expect(status.kontroller).toContainEqual({
      id: 'auth-admin-read',
      namn: 'Supabase Auth Admin',
      status: 'fel',
      beskrivning: 'Worker:n kunde inte läsa Supabase Auth Admin-API:t med service role.',
    })
    expect(status.profiler).toEqual({ antal: 3, status: 'ok' })
  })
})

describe('worker-konfiguration', () => {
  it('matchar wrangler.jsonc för namn, routes och obligatoriska secrets', () => {
    const wranglerPath = fileURLToPath(new URL('../../wrangler.jsonc', import.meta.url))
    const wrangler = JSON.parse(readFileSync(wranglerPath, 'utf8')) as {
      name?: string
      routes?: Array<{ pattern?: string; custom_domain?: boolean }>
      secrets?: { required?: string[] }
    }

    expect(wrangler.name).toBe(adminWorkerNamn)
    expect(wrangler.routes?.map((route) => route.pattern)).toEqual([...adminWorkerDomäner])
    expect(wrangler.routes?.every((route) => route.custom_domain === true)).toBe(true)
    expect(wrangler.secrets?.required).toEqual([...obligatoriskaWorkerSecrets])
  })
})
