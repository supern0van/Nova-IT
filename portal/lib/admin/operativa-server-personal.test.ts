import { beforeAll, describe, expect, it, vi } from 'vitest'

/**
 * hamtaOperativAdminData() läser personal från public.profiles och mappar
 * SystemRoll (administrator/medarbetare) till den operativa personal-/
 * teknikerrollen (Roll). Detta är den riktiga personalmodellen som ersatte
 * den hårdkodade testpersonallistan i lib/auth/demo-auth.ts (borttagen).
 */

function tomSvarsrad() {
  return { data: [], error: null }
}

function skapaFromMock(personalRader: unknown[]) {
  return vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: () => ({
          order: () => Promise.resolve({ data: personalRader, error: null }),
        }),
      }
    }
    return {
      select: () => ({
        order: () => Promise.resolve(tomSvarsrad()),
      }),
    }
  })
}

let hamtaOperativAdminData: typeof import('@/lib/admin/operativa-server').hamtaOperativAdminData

async function laddaMedPersonal(personalRader: unknown[]) {
  vi.resetModules()
  const from = skapaFromMock(personalRader)
  vi.doMock('@/lib/supabase/service', () => ({
    skapaSupabaseServiceklient: () => ({ from }),
  }))
  ;({ hamtaOperativAdminData } = await import('@/lib/admin/operativa-server'))
  return hamtaOperativAdminData()
}

describe('hamtaOperativAdminData – personal från public.profiles', () => {
  it('mappar en administrator-profil till operativ roll "administrator"', async () => {
    const data = await laddaMedPersonal([
      {
        id: 'p-1',
        namn: 'Anna Lindqvist',
        epost: 'anna@nova-it.se',
        roll: 'administrator',
        titel: 'Verksamhetsansvarig',
        aktiv: true,
      },
    ])

    expect(data.personal).toHaveLength(1)
    expect(data.personal[0]).toEqual({
      id: 'p-1',
      namn: 'Anna Lindqvist',
      epost: 'anna@nova-it.se',
      roll: 'administrator',
      initialer: 'AL',
      titel: 'Verksamhetsansvarig',
      aktiv: true,
    })
  })

  it('mappar en medarbetare-profil till operativ roll "tekniker"', async () => {
    const data = await laddaMedPersonal([
      {
        id: 'p-2',
        namn: 'Marcus Ek',
        epost: 'marcus@nova-it.se',
        roll: 'medarbetare',
        titel: 'IT-tekniker',
        aktiv: true,
      },
    ])

    expect(data.personal[0].roll).toBe('tekniker')
  })

  it('faller tillbaka till en rollbaserad standardtitel om titel är tom', async () => {
    const data = await laddaMedPersonal([
      {
        id: 'p-3',
        namn: 'Sofia Bergström',
        epost: 'sofia@nova-it.se',
        roll: 'medarbetare',
        titel: '',
        aktiv: true,
      },
    ])

    expect(data.personal[0].titel).toBe('Medarbetare')
  })

  it('hoppar över rader med ogiltig SystemRoll i stället för att krascha', async () => {
    const data = await laddaMedPersonal([
      {
        id: 'p-4',
        namn: 'Trasig Rad',
        epost: 'trasig@nova-it.se',
        roll: 'superadmin',
        titel: '',
        aktiv: true,
      },
    ])

    expect(data.personal).toEqual([])
  })

  it('hoppar över rader utan aktiv-fält i stället för att anta ett värde', async () => {
    const data = await laddaMedPersonal([
      {
        id: 'p-5',
        namn: 'Saknar Aktivfält',
        epost: 'saknar@nova-it.se',
        roll: 'administrator',
        titel: '',
      },
    ])

    expect(data.personal).toEqual([])
  })

  it('utesluter inte inaktiv personal från svaret – filtrering sker i klienten', async () => {
    const data = await laddaMedPersonal([
      {
        id: 'p-6',
        namn: 'Inaktiv Person',
        epost: 'inaktiv@nova-it.se',
        roll: 'medarbetare',
        titel: '',
        aktiv: false,
      },
    ])

    expect(data.personal).toHaveLength(1)
    expect(data.personal[0].aktiv).toBe(false)
  })
})

beforeAll(() => {
  vi.resetModules()
})
