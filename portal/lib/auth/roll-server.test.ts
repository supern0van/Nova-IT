import { beforeEach, describe, expect, it, vi } from 'vitest'

const maybeSingle = vi.fn()
const eq = vi.fn(() => ({ maybeSingle }))
const select = vi.fn(() => ({ eq }))
const from = vi.fn(() => ({ select }))

vi.mock('@/lib/supabase/service', () => ({
  skapaSupabaseServiceklient: () => ({ from }),
}))

import { hamtaRollFranDatabasen } from '@/lib/auth/roll-server'

describe('hamtaRollFranDatabasen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returnerar en giltig systemroll från profiles-tabellen', async () => {
    maybeSingle.mockResolvedValue({ data: { roll: 'administrator' }, error: null })

    await expect(hamtaRollFranDatabasen('user-1')).resolves.toBe('administrator')
    expect(from).toHaveBeenCalledWith('profiles')
    expect(select).toHaveBeenCalledWith('roll')
    expect(eq).toHaveBeenCalledWith('id', 'user-1')
  })

  it('returnerar null för oväntade rollvärden i databasen', async () => {
    maybeSingle.mockResolvedValue({ data: { roll: 'owner' }, error: null })

    await expect(hamtaRollFranDatabasen('user-1')).resolves.toBeNull()
  })

  it('returnerar null vid saknad profilrad eller databasfel', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    await expect(hamtaRollFranDatabasen('user-saknas')).resolves.toBeNull()

    maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('profiles nere') })
    await expect(hamtaRollFranDatabasen('user-fel')).resolves.toBeNull()
  })
})
