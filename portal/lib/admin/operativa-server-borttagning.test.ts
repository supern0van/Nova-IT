import { beforeAll, describe, expect, it, vi } from 'vitest'

/**
 * Verifierar taBortOperativArenden() och taBortOperativKund() - särskilt att
 * kundborttagning görs i rätt ordning givet databasens FK-constraints
 * (admin_arenden.kund_id och admin_bokningar.kund_id är RESTRICT, inte
 * CASCADE, mot admin_kunder - bokningar och ärenden måste tömmas INNAN
 * kundraden själv kan tas bort).
 */

const bokningDelete = vi.fn().mockResolvedValue({ error: null })
const bokningEq = vi.fn(() => bokningDelete())
const arendeDeleteEq = vi.fn().mockResolvedValue({ error: null })
const arendeDeleteIn = vi.fn(() => arendeDeleteEq())
const kundDeleteEq = vi.fn().mockResolvedValue({ error: null })

const anrop: string[] = []

const from = vi.fn((table: string) => {
  anrop.push(table)
  if (table === 'admin_bokningar') {
    return { delete: vi.fn(() => ({ eq: bokningEq })) }
  }
  if (table === 'admin_arenden') {
    return { delete: vi.fn(() => ({ eq: arendeDeleteIn, in: arendeDeleteIn })) }
  }
  if (table === 'admin_kunder') {
    return { delete: vi.fn(() => ({ eq: kundDeleteEq })) }
  }
  throw new Error(`Oväntad tabell i test: ${table}`)
})

vi.mock('@/lib/supabase/service', () => ({
  skapaSupabaseServiceklient: () => ({ from }),
}))

let taBortOperativArenden: typeof import('@/lib/admin/operativa-server').taBortOperativArenden
let taBortOperativKund: typeof import('@/lib/admin/operativa-server').taBortOperativKund
let OperativtAdminFel: typeof import('@/lib/admin/operativa-server').OperativtAdminFel

beforeAll(async () => {
  ;({ taBortOperativArenden, taBortOperativKund, OperativtAdminFel } = await import(
    '@/lib/admin/operativa-server'
  ))
})

describe('taBortOperativArenden', () => {
  it('tar bort de angivna ärendena', async () => {
    anrop.length = 0
    const resultat = await taBortOperativArenden(['arende-1', 'arende-2'])

    expect(resultat).toEqual(['arende-1', 'arende-2'])
    expect(arendeDeleteIn).toHaveBeenCalledWith('id', ['arende-1', 'arende-2'])
  })

  it('kastar OperativtAdminFel om inga giltiga id:n ges', async () => {
    await expect(taBortOperativArenden([])).rejects.toBeInstanceOf(OperativtAdminFel)
    await expect(taBortOperativArenden(['', '  '])).rejects.toBeInstanceOf(OperativtAdminFel)
  })
})

describe('taBortOperativKund', () => {
  it('tar bort bokningar och ärenden INNAN kundraden, i rätt ordning', async () => {
    anrop.length = 0
    const resultat = await taBortOperativKund('kund-1')

    expect(resultat).toBe('kund-1')
    expect(anrop).toEqual(['admin_bokningar', 'admin_arenden', 'admin_kunder'])
    expect(bokningEq).toHaveBeenCalled()
    expect(kundDeleteEq).toHaveBeenCalledWith('id', 'kund-1')
  })

  it('kastar Error om kund-id saknas', async () => {
    await expect(taBortOperativKund('')).rejects.toBeInstanceOf(Error)
  })
})
