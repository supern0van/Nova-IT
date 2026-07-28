import { describe, expect, it } from 'vitest'

import { byggLosenordsAterstallningsUrl, hamtaSakerAdminOrigin } from '@/lib/admin/admin-url'

function request(origin: string) {
  const url = new URL('/api/admin/profiler', origin)
  return {
    nextUrl: {
      hostname: url.hostname,
      origin: url.origin,
    },
  }
}

describe('admin-url', () => {
  it('behåller kända Worker-domäner som redirect-origin', () => {
    expect(hamtaSakerAdminOrigin(request('https://admin.novait.se'))).toBe(
      'https://admin.novait.se',
    )
    expect(byggLosenordsAterstallningsUrl(request('https://portal.nova-it.se'))).toBe(
      'https://portal.nova-it.se/logga-in?aterstall=1',
    )
  })

  it('faller tillbaka till huvuddomänen för okända origins', () => {
    expect(hamtaSakerAdminOrigin(request('https://extern.example'))).toBe(
      'https://admin.nova-it.se',
    )
    expect(byggLosenordsAterstallningsUrl(request('https://extern.example'))).toBe(
      'https://admin.nova-it.se/logga-in?aterstall=1',
    )
  })
})
