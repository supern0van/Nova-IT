import { describe, expect, it } from 'vitest'

import { sakerOmdirigeringsSokvag } from '@/lib/auth/sakerOmdirigering'

describe('sakerOmdirigeringsSokvag', () => {
  it('tillåter interna sökvägar och bevarar query string', () => {
    expect(sakerOmdirigeringsSokvag('/portal')).toBe('/portal')
    expect(sakerOmdirigeringsSokvag('/portal/installningar?flik=system')).toBe(
      '/portal/installningar?flik=system',
    )
  })

  it('nekar externa och protokollrelativa destinationer', () => {
    expect(sakerOmdirigeringsSokvag('https://evil.example')).toBeNull()
    expect(sakerOmdirigeringsSokvag('http://evil.example')).toBeNull()
    expect(sakerOmdirigeringsSokvag('//evil.example')).toBeNull()
    expect(sakerOmdirigeringsSokvag('/\\evil.example')).toBeNull()
  })

  it('nekar schemaförsök, radbrytningar och tomma värden', () => {
    expect(sakerOmdirigeringsSokvag('/javascript://alert(1)')).toBeNull()
    expect(sakerOmdirigeringsSokvag('/portal\nLocation: https://evil.example')).toBeNull()
    expect(sakerOmdirigeringsSokvag('')).toBeNull()
    expect(sakerOmdirigeringsSokvag(null)).toBeNull()
    expect(sakerOmdirigeringsSokvag(undefined)).toBeNull()
  })

  it('nekar sökvägar som inte börjar relativt från app-roten', () => {
    expect(sakerOmdirigeringsSokvag('portal')).toBeNull()
    expect(sakerOmdirigeringsSokvag('..')).toBeNull()
    expect(sakerOmdirigeringsSokvag('javascript:alert(1)')).toBeNull()
  })
})
