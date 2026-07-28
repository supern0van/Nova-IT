import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const apiRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)))

function listaRouteFiler(rot: string): string[] {
  return readdirSync(rot).flatMap((namn) => {
    const filvag = path.join(rot, namn)
    const stat = statSync(filvag)
    if (stat.isDirectory()) return listaRouteFiler(filvag)
    return namn === 'route.ts' ? [filvag] : []
  })
}

describe('admin API route-kontrakt', () => {
  it('har testfil och AAL2-serverhelper för varje API-route', () => {
    const routes = listaRouteFiler(apiRoot)

    expect(routes.map((filvag) => path.relative(apiRoot, filvag)).sort()).toEqual([
      'admin\\profiler\\route.ts',
      'admin\\profiler\\[id]\\losenord\\route.ts',
      'admin\\profiler\\[id]\\route.ts',
      'admin\\systemstatus\\route.ts',
      'mfa\\aterstall\\route.ts',
      'roll\\route.ts',
    ].sort())

    for (const route of routes) {
      const innehall = readFileSync(route, 'utf8')
      const testFil = path.join(path.dirname(route), 'route.test.ts')

      expect(statSync(testFil).isFile()).toBe(true)
      expect(innehall).toContain('hamtaAutentiseradAnvandarId')
    }
  })

  it('kräver admin- eller rollkontroll för varje skyddad route', () => {
    for (const route of listaRouteFiler(apiRoot)) {
      const relativ = path.relative(apiRoot, route)
      const innehall = readFileSync(route, 'utf8')
      const harRollKontroll =
        innehall.includes('harAdminAtkomst') ||
        innehall.includes('hamtaRollFranDatabasen') ||
        relativ === 'roll\\route.ts'

      expect(harRollKontroll, relativ).toBe(true)
    }
  })
})
