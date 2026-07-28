import { describe, expect, it } from 'vitest'

import {
  initialerFranNamn,
  personalInitialer,
  personalNamn,
  tilldelningsbarPersonal,
} from '@/lib/personal'
import type { Anvandare } from '@/lib/types'

const personal: Anvandare[] = [
  {
    id: 'p-1',
    namn: 'Anna Lindqvist',
    epost: 'anna@nova-it.se',
    roll: 'administrator',
    initialer: 'AL',
    titel: 'Verksamhetsansvarig',
    aktiv: true,
  },
  {
    id: 'p-2',
    namn: 'Marcus Ek',
    epost: 'marcus@nova-it.se',
    roll: 'tekniker',
    initialer: 'ME',
    titel: 'IT-tekniker',
    aktiv: false,
  },
]

describe('personalNamn', () => {
  it('returnerar "Ej tilldelad" för null/undefined id', () => {
    expect(personalNamn(personal, null)).toBe('Ej tilldelad')
    expect(personalNamn(personal, undefined)).toBe('Ej tilldelad')
  })

  it('returnerar namnet för en känd person', () => {
    expect(personalNamn(personal, 'p-1')).toBe('Anna Lindqvist')
  })

  it('returnerar "Okänd användare" för ett id som inte finns i listan', () => {
    expect(personalNamn(personal, 'saknas')).toBe('Okänd användare')
  })
})

describe('personalInitialer', () => {
  it('returnerar "–" för null/undefined id', () => {
    expect(personalInitialer(personal, null)).toBe('–')
  })

  it('returnerar initialerna för en känd person', () => {
    expect(personalInitialer(personal, 'p-2')).toBe('ME')
  })

  it('returnerar "?" för ett okänt id', () => {
    expect(personalInitialer(personal, 'saknas')).toBe('?')
  })
})

describe('tilldelningsbarPersonal', () => {
  it('filtrerar bort inaktiv personal', () => {
    const resultat = tilldelningsbarPersonal(personal)
    expect(resultat).toHaveLength(1)
    expect(resultat[0].id).toBe('p-1')
  })
})

describe('initialerFranNamn', () => {
  it('tar första bokstaven i första och sista ordet', () => {
    expect(initialerFranNamn('Anna Lindqvist')).toBe('AL')
  })

  it('hanterar namn med tre delar genom att ta första och sista', () => {
    expect(initialerFranNamn('Anna Britt Lindqvist')).toBe('AL')
  })

  it('tar de två första bokstäverna om namnet är ett enda ord', () => {
    expect(initialerFranNamn('webmaster')).toBe('WE')
  })

  it('returnerar "?" för ett tomt namn', () => {
    expect(initialerFranNamn('   ')).toBe('?')
  })
})
