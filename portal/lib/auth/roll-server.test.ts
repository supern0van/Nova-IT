import { beforeEach, describe, expect, it, vi } from 'vitest'

const maybeSingle = vi.fn()
const eq = vi.fn(() => ({ maybeSingle }))
const select = vi.fn(() => ({ eq }))
const from = vi.fn(() => ({ select }))

vi.mock('@/lib/supabase/service', () => ({
  skapaSupabaseServiceklient: () => ({ from }),
}))

import { hamtaEgenProfilFranDatabasen, hamtaRollFranDatabasen } from '@/lib/auth/roll-server'

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

describe('hamtaEgenProfilFranDatabasen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returnerar verifierade profilfält för den egna profilen', async () => {
    maybeSingle.mockResolvedValue({
      data: { epost: 'admin@nova-it.se', namn: 'Admin' },
      error: null,
    })

    await expect(hamtaEgenProfilFranDatabasen('user-1')).resolves.toEqual({
      epost: 'admin@nova-it.se',
      namn: 'Admin',
    })
    expect(from).toHaveBeenCalledWith('profiles')
    expect(select).toHaveBeenCalledWith('epost, namn')
    expect(eq).toHaveBeenCalledWith('id', 'user-1')
  })

  it('returnerar null om profilfält saknas eller är tomma', async () => {
    maybeSingle.mockResolvedValueOnce({ data: { epost: '', namn: 'Admin' }, error: null })
    await expect(hamtaEgenProfilFranDatabasen('user-tom-epost')).resolves.toBeNull()

    maybeSingle.mockResolvedValueOnce({ data: { epost: 'admin@nova-it.se', namn: '' }, error: null })
    await expect(hamtaEgenProfilFranDatabasen('user-tomt-namn')).resolves.toBeNull()

    maybeSingle.mockResolvedValueOnce({ data: { epost: 'admin@nova-it.se' }, error: null })
    await expect(hamtaEgenProfilFranDatabasen('user-trasig')).resolves.toBeNull()
  })
})
