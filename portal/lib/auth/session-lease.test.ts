import { describe, expect, it } from 'vitest'

import { skapaSessionLease, verifieraSessionLease } from './session-lease'

process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role'

describe('server-side session lease', () => {
  it('binder leasen till rätt Supabase-session och användare', async () => {
    const lease = await skapaSessionLease('session-1', 'user-1', 1_000)

    expect(await verifieraSessionLease(lease, 'session-1', 'user-1', 1_000 + 60_000)).toMatchObject({
      giltig: true,
    })
    expect(await verifieraSessionLease(lease, 'session-2', 'user-1', 1_000 + 60_000)).toMatchObject({
      giltig: false,
      orsak: 'utgangen',
    })
  })

  it('avvisar manipulerad eller för gammal lease', async () => {
    const lease = await skapaSessionLease('session-1', 'user-1', 1_000)

    expect(await verifieraSessionLease(`${lease}x`, 'session-1', 'user-1', 1_000)).toMatchObject({
      giltig: false,
    })
    expect(await verifieraSessionLease(lease, 'session-1', 'user-1', 1_201_001)).toMatchObject({
      giltig: false,
      orsak: 'utgangen',
    })
  })
})
