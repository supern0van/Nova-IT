import { describe, expect, it } from 'vitest'

import { hamtaRollFranApiSvar } from '@/lib/auth/roll-api-svar'

describe('roll-api-svar', () => {
  it('läser giltigt rollsvar med profil', () => {
    expect(
      hamtaRollFranApiSvar({
        roll: 'administrator',
        profil: { epost: 'admin@nova-it.se', namn: 'Admin' },
      }),
    ).toEqual({
      roll: 'administrator',
      profil: { epost: 'admin@nova-it.se', namn: 'Admin' },
    })
  })

  it('läser giltigt rollsvar utan profil', () => {
    expect(hamtaRollFranApiSvar({ roll: null })).toEqual({ roll: null })
    expect(hamtaRollFranApiSvar({ roll: 'medarbetare', profil: null })).toEqual({
      roll: 'medarbetare',
      profil: null,
    })
  })

  it('nekar oväntad roll eller profilform', () => {
    expect(hamtaRollFranApiSvar({ roll: 'owner' })).toBeNull()
    expect(hamtaRollFranApiSvar({ roll: 'administrator', profil: { epost: 1 } })).toBeNull()
    expect(hamtaRollFranApiSvar({ profil: null })).toBeNull()
  })
})
