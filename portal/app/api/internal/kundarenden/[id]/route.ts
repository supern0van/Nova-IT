import { NextResponse, type NextRequest } from 'next/server'

import { KundArendeFel, hamtaKundArende } from '@/lib/admin/kundarenden-server'

/**
 * Ett enskilt ärende med konversation, för kundportalens ärendevy. Samma
 * hemlighetsskydd som `../route.ts` (listan) – se den filen för motivering.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const hemlighetsstatus = verifieraHemlighet(request)
  if (hemlighetsstatus !== 200) {
    return NextResponse.json({ ok: false }, { status: hemlighetsstatus })
  }

  const adminKundId = request.nextUrl.searchParams.get('adminKundId')
  if (!adminKundId) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const { id } = await params

  try {
    const arende = await hamtaKundArende(adminKundId, id)
    if (!arende) return NextResponse.json({ ok: false }, { status: 404 })
    return NextResponse.json({ ok: true, arende })
  } catch (error) {
    if (error instanceof KundArendeFel) {
      return NextResponse.json({ ok: false }, { status: error.status })
    }
    console.error('Kunde inte hämta kundens ärende.', error)
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
