import { describe, expect, it } from 'vitest'

import {
  arGiltigEpost,
  arGiltigtNamn,
  arGiltigTelefon,
  arPostgresFelkod,
  nullableText,
  optionalText,
  text,
} from './validering'

/**
 * Delad valideringsmodul för operativa-server.ts och publikt-intag-server.ts
 * (se filens egen dokumentationskommentar för bakgrunden till varför den
 * finns - ett riktigt glapp hade redan hunnit uppstå i telefonvalideringen
 * innan de här hjälparna konsoliderades hit).
 */

describe('text/optionalText/nullableText', () => {
  it('trimmar strängar och returnerar tomsträng för icke-strängar', () => {
    expect(text('  hej  ')).toBe('hej')
    expect(text(null)).toBe('')
    expect(text(undefined)).toBe('')
    expect(text(123)).toBe('')
  })

  it('optionalText returnerar undefined för tom sträng', () => {
    expect(optionalText('  ')).toBeUndefined()
    expect(optionalText('hej')).toBe('hej')
  })

  it('nullableText returnerar null för tom sträng', () => {
    expect(nullableText('  ')).toBeNull()
    expect(nullableText('hej')).toBe('hej')
  })
})

describe('arGiltigtNamn', () => {
  it('kräver 2-160 tecken', () => {
    expect(arGiltigtNamn('A')).toBe(false)
    expect(arGiltigtNamn('Ab')).toBe(true)
    expect(arGiltigtNamn('A'.repeat(160))).toBe(true)
    expect(arGiltigtNamn('A'.repeat(161))).toBe(false)
  })
})

describe('arGiltigEpost', () => {
  it('kräver ett rimligt e-postformat', () => {
    expect(arGiltigEpost('test@example.se')).toBe(true)
    expect(arGiltigEpost('inte-en-epost')).toBe(false)
    expect(arGiltigEpost('a@b.co')).toBe(true)
  })
})

describe('arGiltigTelefon', () => {
  it('accepterar siffror, mellanslag, bindestreck, parenteser och inledande +', () => {
    expect(arGiltigTelefon('070-123 45 67')).toBe(true)
    expect(arGiltigTelefon('+46 70 123 45 67')).toBe(true)
    expect(arGiltigTelefon('(070) 1234567')).toBe(true)
  })

  it('avvisar för korta nummer och nummer med otillåtna tecken', () => {
    expect(arGiltigTelefon('123')).toBe(false)
    // Regressionstest: det HÄR var glappet mellan operativa-server.ts och
    // publikt-intag-server.ts innan de delade samma valideringsfunktion -
    // publikt-intag-server.ts:s egen kopia saknade teckenbegränsningen och
    // hade släppt igenom detta.
    expect(arGiltigTelefon('070<script>1234567')).toBe(false)
    expect(arGiltigTelefon('abc-070-1234567-xyz')).toBe(false)
  })
})

describe('arPostgresFelkod', () => {
  it('matchar ett Postgres-felobjekt med rätt kod', () => {
    expect(arPostgresFelkod({ code: '23505' }, '23505')).toBe(true)
    expect(arPostgresFelkod({ code: '23503' }, '23505')).toBe(false)
  })

  it('returnerar false för icke-objekt', () => {
    expect(arPostgresFelkod(null, '23505')).toBe(false)
    expect(arPostgresFelkod('sträng', '23505')).toBe(false)
  })
})
