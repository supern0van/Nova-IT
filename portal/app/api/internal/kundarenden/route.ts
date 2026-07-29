import { NextResponse, type NextRequest } from 'next/server'

import { KundArendeFel, hamtaKundArenden } from '@/lib/admin/kundarenden-server'

/**
 * Listar en kunds egna ärenden – anropas ENDAST av kundportalens egen
 * serverkod, server-till-server, aldrig direkt av en kunds webbläsare.
 * Samma hemlighetsmönster som `app/api/public/intag/route.ts`, men med en
 * egen, distinkt hemlighet (`ADMINPORTAL_INTAG_SECRET`) för den här
 * riktningen (kundportalen → adminportalen).
 */
export async function GET(request: NextRequest) {
  const hemlighetsstatus = verifieraHemlighet(request)
  if (hemlighetsstatus !== 200) {
    return NextResponse.json({ ok: false }, { status: hemlighetsstatus })
  }

  const adminKundId = request.nextUrl.searchParams.get('adminKundId')
  if (!adminKundId) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  try {
    const arenden = await hamtaKundArenden(adminKundId)
    return NextResponse.json({ ok: true, arenden })
  } catch (error) {
    if (error instanceof KundArendeFel) {
      return NextResponse.json({ ok: false }, { status: error.status })
    }
    console.error('Kunde inte hämta kundens ärenden.', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

function verifieraHemlighet(request: NextRequest): 200 | 401 | 500 {
  const konfigureradHemlighet = process.env.ADMINPORTAL_INTAG_SECRET
  if (!konfigureradHemlighet) {
    console.error('ADMINPORTAL_INTAG_SECRET saknas – kundärende-API:et kan inte verifiera anrop.')
    return 500
  }

  const mottagenHemlighet = request.headers.get('x-adminportal-intag-secret')
  if (!mottagenHemlighet || !timmingSaker(mottagenHemlighet, konfigureradHemlighet)) {
    return 401
  }

  return 200
}

function timmingSaker(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let resultat = 0
  for (let i = 0; i < a.length; i++) {
    resultat |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return resultat === 0
}
