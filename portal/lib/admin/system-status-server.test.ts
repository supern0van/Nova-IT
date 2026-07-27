import { beforeEach, describe, expect, it, vi } from 'vitest'

const select = vi.fn()
const from = vi.fn(() => ({ select }))
const skapaSupabaseServiceklient = vi.fn(() => ({ from }))

vi.mock('@/lib/supabase/service', () => ({ skapaSupabaseServiceklient }))

let hamtaSystemStatus: typeof import('@/lib/admin/system-status-server').hamtaSystemStatus

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
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
    expect(from).toHaveBeenCalledWith('profiles')
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
})
