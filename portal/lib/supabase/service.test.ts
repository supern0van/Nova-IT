import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const portalRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
const ignoreradeMappar = new Set(['.next', '.open-next', '.wrangler', 'node_modules'])

function listaKallfiler(rot: string): string[] {
  return readdirSync(rot).flatMap((namn) => {
    const filvag = path.join(rot, namn)
    const stat = statSync(filvag)
    if (stat.isDirectory()) {
      if (ignoreradeMappar.has(namn)) return []
      return listaKallfiler(filvag)
    }
    return /\.(ts|tsx)$/.test(namn) ? [filvag] : []
  })
}

describe('supabase service-rollklient', () => {
  it('importeras eller refereras inte från client-komponenter', () => {
    const otillatnaReferenser = listaKallfiler(portalRoot).filter((filvag) => {
      const innehall = readFileSync(filvag, 'utf8')
      const arClientFil = /^\s*['"]use client['"]/.test(innehall)
      return (
        arClientFil &&
        (innehall.includes('@/lib/supabase/service') ||
          innehall.includes('SUPABASE_SERVICE_ROLE_KEY'))
      )
    })

    expect(otillatnaReferenser.map((filvag) => path.relative(portalRoot, filvag))).toEqual([])
  })
})
