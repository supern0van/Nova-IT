import { describe, expect, it } from 'vitest'

import { adminNastaSteg } from '@/lib/admin/nasta-steg'

describe('adminNastaSteg', () => {
  it('prioriterar ägarskap för öppna otilldelade ärenden', () => {
    expect(adminNastaSteg('ny', false).rubrik).toBe('Tilldela en ansvarig')
    expect(adminNastaSteg('pagaende', false).rubrik).toBe('Tilldela en ansvarig')
  })

  it('ger ett konkret nästa steg för kundväntan och bokning', () => {
    expect(adminNastaSteg('vantar_pa_kund', true).rubrik).toContain('kundens svar')
    expect(adminNastaSteg('bokad', true).rubrik).toBe('Förbered bokningen')
  })

  it('kräver inte tilldelning efter avslut', () => {
    expect(adminNastaSteg('stangd', false).rubrik).toBe('Ingen aktiv åtgärd')
  })
})
