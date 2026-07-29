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

// Routes som medvetet INTE använder AAL2-sessionsautentisering. En anonym
// besökare på den publika webbplatsen har varken ett portalkonto eller en
// MFA-verifierad session, så AAL2-kontraktet nedan gäller inte dem – de har
// i stället en egen, likvärdig server-till-server-kontroll (delad
// hemlighet, se route-filens egen dokumentation). Lägg ALDRIG till en route
// här utan att verifiera att den har en egen, minst lika stark spärr.
const publikaServerTillServerRoutes = new Set(['public/intag/route.ts'])

describe('admin API route-kontrakt', () => {
  it('har testfil och AAL2-serverhelper för varje admin-API-route', () => {
    const routes = listaRouteFiler(apiRoot)

    expect(routes.map(relativApiPath).sort()).toEqual([
      'admin/profiler/[id]/losenord/route.ts',
      'admin/profiler/[id]/route.ts',
      'admin/profiler/route.ts',
      'admin/operativt/route.ts',
      'admin/systemstatus/route.ts',
      'mfa/aterstall/route.ts',
      'public/intag/route.ts',
      'roll/route.ts',
      'session/lease/route.ts',
    ].sort())

    for (const route of routes) {
      const relativ = relativApiPath(route)
      const innehall = readFileSync(route, 'utf8')
      const testFil = path.join(path.dirname(route), 'route.test.ts')

      expect(statSync(testFil).isFile()).toBe(true)
      if (publikaServerTillServerRoutes.has(relativ)) continue
      expect(
        innehall.includes('hamtaAutentiseradAnvandarId') || innehall.includes('hamtaAutentiseradAnvandare'),
      ).toBe(true)
    }
  })

  it('kräver admin- eller rollkontroll för varje AAL2-skyddad route', () => {
    for (const route of listaRouteFiler(apiRoot)) {
      const relativ = relativApiPath(route)
      if (publikaServerTillServerRoutes.has(relativ)) continue

      const innehall = readFileSync(route, 'utf8')
      const harRollKontroll =
        innehall.includes('harAdminAtkomst') ||
        innehall.includes('hamtaRollFranDatabasen') ||
        relativ === 'roll/route.ts' ||
        relativ === 'session/lease/route.ts'

      expect(harRollKontroll, relativ).toBe(true)
    }
  })

  it('kräver en delad hemlighetskontroll för publika server-till-server-routes', () => {
    for (const relativ of publikaServerTillServerRoutes) {
      const innehall = readFileSync(path.join(apiRoot, relativ), 'utf8')
      expect(innehall, relativ).toMatch(/INTAG_SECRET/)
      expect(innehall, relativ).not.toContain('hamtaAutentiseradAnvandarId')
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
        // public/intag/route.ts visar medvetet .message – men ENDAST från
        // PubliktIntagFel, en av oss skriven, kontrollerad valideringssträng
        // (t.ex. "Ange en giltig e-postadress.") som är avsedd att visas för
        // den publika webbplatsens formulär. Okända/oväntade fel faller
        // uttryckligen till ett meddelandelöst 500 – verifierat separat i
        // route.test.ts ("läcker inte interna felobjekt vid oväntat fel").
        if (relativ === 'public/intag/route.ts' && monster.source === /\.message\b/.source) {
          continue
        }
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
    expect(middleware).toContain("matcher: ['/:path*']")
  })
})
