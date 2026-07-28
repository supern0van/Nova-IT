import { describe, expect, it } from 'vitest'

import {
  hamtaProfilFranApiSvar,
  hamtaProfilerFranApiSvar,
  hamtaSystemStatusFranApiSvar,
} from '@/lib/admin/admin-api-svar'

const giltigProfil = {
  id: 'user-1',
  epost: 'admin@nova-it.se',
  namn: 'Admin',
  roll: 'administrator',
  skapad: '2026-07-27T00:00:00.000Z',
  uppdaterad: '2026-07-28T00:00:00.000Z',
  kontoHalsa: {
    epostBekraftad: true,
    senastInloggad: null,
    authSkapad: '2026-07-27T00:00:00.000Z',
    mfaAntalFaktorer: 2,
    mfaVerifieradeFaktorer: 1,
  },
}

describe('admin-api-svar', () => {
  it('läser profiler från ett giltigt API-svar', () => {
    expect(hamtaProfilerFranApiSvar({ profiler: [giltigProfil] })).toEqual([giltigProfil])
    expect(hamtaProfilFranApiSvar({ profil: giltigProfil })).toEqual(giltigProfil)
  })

  it('nekar profiler med ogiltig systemroll eller kontoHälsa-form', () => {
    expect(
      hamtaProfilerFranApiSvar({
        profiler: [{ ...giltigProfil, roll: 'owner' }],
      }),
    ).toBeNull()
    expect(
      hamtaProfilFranApiSvar({
        profil: {
          ...giltigProfil,
          kontoHalsa: { ...giltigProfil.kontoHalsa, mfaVerifieradeFaktorer: '1' },
        },
      }),
    ).toBeNull()
  })

  it('läser driftstatus från ett giltigt API-svar', () => {
    expect(
      hamtaSystemStatusFranApiSvar({
        status: {
          kontroller: [
            {
              id: 'profiles-read',
              namn: 'Profiles-tabellen',
              status: 'ok',
              beskrivning: 'Worker:n kan läsa portalkonton från Supabase.',
            },
          ],
          profiler: { antal: 1, status: 'ok' },
        },
      }),
    ).toEqual({
      kontroller: [
        {
          id: 'profiles-read',
          namn: 'Profiles-tabellen',
          status: 'ok',
          beskrivning: 'Worker:n kan läsa portalkonton från Supabase.',
        },
      ],
      profiler: { antal: 1, status: 'ok' },
    })
  })

  it('nekar driftstatus med okänd statusnivå eller fel antaltyp', () => {
    expect(
      hamtaSystemStatusFranApiSvar({
        status: {
          kontroller: [{ id: 'x', namn: 'X', status: 'okand', beskrivning: 'x' }],
          profiler: { antal: 1, status: 'ok' },
        },
      }),
    ).toBeNull()
    expect(
      hamtaSystemStatusFranApiSvar({
        status: {
          kontroller: [{ id: 'x', namn: 'X', status: 'ok', beskrivning: 'x' }],
          profiler: { antal: '1', status: 'ok' },
        },
      }),
    ).toBeNull()
  })
})
