import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

const listFactors = vi.fn()
const deleteFactor = vi.fn()
const maybeSingle = vi.fn()

function skapaFranTabellMock() {
  return {
    select: () => ({
      ilike: () => ({ maybeSingle }),
    }),
  }
}

vi.mock('@/lib/supabase/service', () => ({
  skapaSupabaseServiceklient: () => ({
    from: () => skapaFranTabellMock(),
    auth: { admin: { mfa: { listFactors, deleteFactor } } },
  }),
}))

let aterstallMfaForEpost: typeof import('@/lib/auth/mfa-admin-server').aterstallMfaForEpost

beforeAll(async () => {
  ;({ aterstallMfaForEpost } = await import('@/lib/auth/mfa-admin-server'))
})

describe('aterstallMfaForEpost (admin-återställningsflöde)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returnerar anvandare_saknas om ingen profil hittas', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })

    const resultat = await aterstallMfaForEpost('okand@nova-it.se')

    expect(resultat).toEqual({ ok: false, fel: 'anvandare_saknas' })
    expect(listFactors).not.toHaveBeenCalled()
  })

  it('returnerar anvandare_saknas om profiles-uppslaget kastar', async () => {
    maybeSingle.mockRejectedValue(new Error('profiles nere'))

    const resultat = await aterstallMfaForEpost('okand@nova-it.se')

    expect(resultat).toEqual({ ok: false, fel: 'anvandare_saknas' })
    expect(listFactors).not.toHaveBeenCalled()
  })

  it('returnerar inga_faktorer om användaren inte har någon MFA att ta bort', async () => {
    maybeSingle.mockResolvedValue({ data: { id: 'user-1' }, error: null })
    listFactors.mockResolvedValue({ data: { factors: [] }, error: null })

    const resultat = await aterstallMfaForEpost('utankonto@nova-it.se')

    expect(resultat).toEqual({ ok: false, fel: 'inga_faktorer' })
  })

  it('returnerar serverfel om initial faktorlista kastar', async () => {
    maybeSingle.mockResolvedValue({ data: { id: 'user-1' }, error: null })
    listFactors.mockRejectedValue(new Error('mfa-api nere'))

    const resultat = await aterstallMfaForEpost('utelast@nova-it.se')

    expect(resultat).toEqual({ ok: false, fel: 'serverfel' })
    expect(deleteFactor).not.toHaveBeenCalled()
  })

  it('tar bort samtliga faktorer, verifierar med en ny listFactors och returnerar antalet', async () => {
    maybeSingle.mockResolvedValue({ data: { id: 'user-1' }, error: null })
    listFactors
      // Första anropet: initial lista över befintliga faktorer.
      .mockResolvedValueOnce({
        data: { factors: [{ id: 'faktor-1' }, { id: 'faktor-2' }] },
        error: null,
      })
      // Andra anropet: verifiering EFTER borttagningsförsöken – inget kvar.
      .mockResolvedValueOnce({ data: { factors: [] }, error: null })
    deleteFactor.mockResolvedValue({ data: { id: 'faktor-1' }, error: null })

    const resultat = await aterstallMfaForEpost('utelast@nova-it.se')

    expect(resultat).toEqual({ ok: true, antalBorttagnaFaktorer: 2 })
    expect(deleteFactor).toHaveBeenCalledWith({ id: 'faktor-1', userId: 'user-1' })
    expect(deleteFactor).toHaveBeenCalledWith({ id: 'faktor-2', userId: 'user-1' })
    // Verifierar sluttillståndet, inte bara delete-svaren.
    expect(listFactors).toHaveBeenCalledTimes(2)
    expect(listFactors).toHaveBeenNthCalledWith(2, { userId: 'user-1' })
  })

  it('delvis misslyckad återställning (1 av 2 raderingar misslyckas): returnerar INTE framgång', async () => {
    maybeSingle.mockResolvedValue({ data: { id: 'user-1' }, error: null })
    listFactors
      .mockResolvedValueOnce({
        data: { factors: [{ id: 'faktor-1' }, { id: 'faktor-2' }] },
        error: null,
      })
      // Verifieringen visar att faktor-2 fortfarande finns kvar.
      .mockResolvedValueOnce({ data: { factors: [{ id: 'faktor-2' }] }, error: null })
    deleteFactor
      .mockResolvedValueOnce({ data: { id: 'faktor-1' }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'boom' } })

    const resultat = await aterstallMfaForEpost('delvis@nova-it.se')

    expect(resultat).toEqual({ ok: false, fel: 'partiell_atersallning', antalKvarvarande: 1 })
    // ALDRIG ok:true när en faktor fortfarande finns kvar.
    expect(resultat.ok).toBe(false)
  })

  it('samtliga borttagningar misslyckas OCH faktorn finns fortfarande kvar vid verifiering: partiell_atersallning', async () => {
    maybeSingle.mockResolvedValue({ data: { id: 'user-1' }, error: null })
    listFactors
      .mockResolvedValueOnce({ data: { factors: [{ id: 'faktor-1' }] }, error: null })
      .mockResolvedValueOnce({ data: { factors: [{ id: 'faktor-1' }] }, error: null })
    deleteFactor.mockResolvedValue({ data: null, error: { message: 'boom' } })

    const resultat = await aterstallMfaForEpost('fel@nova-it.se')

    expect(resultat).toEqual({ ok: false, fel: 'partiell_atersallning', antalKvarvarande: 1 })
  })

  it('fortsätter till verifiering om ett deleteFactor-anrop kastar', async () => {
    maybeSingle.mockResolvedValue({ data: { id: 'user-1' }, error: null })
    listFactors
      .mockResolvedValueOnce({
        data: { factors: [{ id: 'faktor-1' }, { id: 'faktor-2' }] },
        error: null,
      })
      .mockResolvedValueOnce({ data: { factors: [{ id: 'faktor-1' }] }, error: null })
    deleteFactor
      .mockRejectedValueOnce(new Error('delete timeout'))
      .mockResolvedValueOnce({ data: { id: 'faktor-2' }, error: null })

    const resultat = await aterstallMfaForEpost('delvis@nova-it.se')

    expect(resultat).toEqual({ ok: false, fel: 'partiell_atersallning', antalKvarvarande: 1 })
    expect(deleteFactor).toHaveBeenCalledTimes(2)
  })

  it('verifierar alltid sluttillståndet – rapporterar aldrig framgång om verifieringsanropet i sig misslyckas', async () => {
    maybeSingle.mockResolvedValue({ data: { id: 'user-1' }, error: null })
    listFactors
      .mockResolvedValueOnce({ data: { factors: [{ id: 'faktor-1' }] }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'network blip' } })
    deleteFactor.mockResolvedValue({ data: { id: 'faktor-1' }, error: null })

    const resultat = await aterstallMfaForEpost('overifierbar@nova-it.se')

    expect(resultat).toEqual({ ok: false, fel: 'serverfel' })
  })

  it('returnerar serverfel om verifieringsanropet kastar efter delete', async () => {
    maybeSingle.mockResolvedValue({ data: { id: 'user-1' }, error: null })
    listFactors
      .mockResolvedValueOnce({ data: { factors: [{ id: 'faktor-1' }] }, error: null })
      .mockRejectedValueOnce(new Error('verifiering nere'))
    deleteFactor.mockResolvedValue({ data: { id: 'faktor-1' }, error: null })

    const resultat = await aterstallMfaForEpost('overifierbar@nova-it.se')

    expect(resultat).toEqual({ ok: false, fel: 'serverfel' })
  })
})
