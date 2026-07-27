import { describe, expect, it } from 'vitest'

import { harUppnattAal2 } from '@/lib/auth/mfa'

describe('harUppnattAal2', () => {
  it('returnerar true endast för aal2', () => {
    expect(harUppnattAal2('aal2')).toBe(true)
  })

  it('returnerar false för aal1', () => {
    expect(harUppnattAal2('aal1')).toBe(false)
  })

  it('faller stängt (false) för null/undefined/tomt/okänt värde', () => {
    expect(harUppnattAal2(null)).toBe(false)
    expect(harUppnattAal2(undefined)).toBe(false)
    expect(harUppnattAal2('')).toBe(false)
    expect(harUppnattAal2('nagot-okant')).toBe(false)
  })
})
