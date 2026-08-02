import { describe, expect, it } from 'vitest'

import { skapaSessionLease, verifieraSessionLease } from './session-lease'

process.env.ADMIN_SESSION_LEASE_SECRET = 'test-session-lease-secret'

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

  it('återanvänder inte Supabase service-role som fallback-hemlighet', async () => {
    const ursprungligLeaseSecret = process.env.ADMIN_SESSION_LEASE_SECRET
    const ursprungligServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.ADMIN_SESSION_LEASE_SECRET
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role'

    try {
      await expect(skapaSessionLease('session-1', 'user-1')).resolves.toBeNull()
      await expect(verifieraSessionLease('payload.signatur', 'session-1', 'user-1')).resolves.toMatchObject({
        giltig: false,
        orsak: 'saknas',
      })
    } finally {
      process.env.ADMIN_SESSION_LEASE_SECRET = ursprungligLeaseSecret
      if (ursprungligServiceRole === undefined) {
        delete process.env.SUPABASE_SERVICE_ROLE_KEY
      } else {
        process.env.SUPABASE_SERVICE_ROLE_KEY = ursprungligServiceRole
      }
    }
  })
})
