import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const apiRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)))
const appRoot = path.resolve(apiRoot, '..', '..')

function relativApiPath(filvag: string): string {
  return path.relative(apiRoot, filvag).split(path.sep).join('/')
}

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

    expect(routes.map(relativApiPath).sort()).toEqual([
      'admin/profiler/[id]/losenord/route.ts',
      'admin/profiler/[id]/route.ts',
      'admin/profiler/route.ts',
      'admin/systemstatus/route.ts',
      'mfa/aterstall/route.ts',
      'roll/route.ts',
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
      const relativ = relativApiPath(route)
      const innehall = readFileSync(route, 'utf8')
      const harRollKontroll =
        innehall.includes('harAdminAtkomst') ||
        innehall.includes('hamtaRollFranDatabasen') ||
        relativ === 'roll/route.ts'

      expect(harRollKontroll, relativ).toBe(true)
    }
  })

  it('läcker inte råa interna felobjekt i route-svar', () => {
    const forbjudnaFelLackor = [
      /\.message\b/,
      /\.stack\b/,
      /String\(\s*(error|fel)\s*\)/,
      /JSON\.stringify\(\s*(error|fel)\s*\)/,
      /NextResponse\.json\(\s*(error|fel)\b/,
    ]

    for (const route of listaRouteFiler(apiRoot)) {
      const relativ = relativApiPath(route)
      const innehall = readFileSync(route, 'utf8')

      for (const monster of forbjudnaFelLackor) {
        expect(innehall, `${relativ} får inte exponera ${monster}`).not.toMatch(monster)
      }
    }
  })

  it('behåller OpenNext-kompatibelt middleware-skydd och ingen root proxy.ts', () => {
    const middlewarePath = path.join(appRoot, 'middleware.ts')
    const rootProxyPath = path.join(appRoot, 'proxy.ts')
    const middleware = readFileSync(middlewarePath, 'utf8')

    expect(existsSync(middlewarePath)).toBe(true)
    expect(existsSync(rootProxyPath)).toBe(false)
    expect(middleware).toContain('uppdateraSessionOchSkyddaPortal')
    expect(middleware).toContain("'/portal/:path*'")
    expect(middleware).toContain("'/mfa/:path*'")
  })
})
