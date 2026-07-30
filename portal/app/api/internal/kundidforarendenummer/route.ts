import { NextResponse, type NextRequest } from 'next/server'

import { KundArendeFel, hamtaKundIdForArendenummer } from '@/lib/admin/kundarenden-server'

/**
 * Slår upp vilken kund ett ärendenummer tillhör – anropas ENDAST av
 * kundportalens egen inloggningsroute, server-till-server. Samma
 * hemlighetsmönster som `app/api/internal/kundarenden/route.ts`.
 */
export async function GET(request: NextRequest) {
  const hemlighetsstatus = verifieraHemlighet(request)
  if (hemlighetsstatus !== 200) {
    return NextResponse.json({ ok: false }, { status: hemlighetsstatus })
  }

  const arendenummer = request.nextUrl.searchParams.get('arendenummer')
  if (!arendenummer) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  try {
    const adminKundId = await hamtaKundIdForArendenummer(arendenummer)
    if (!adminKundId) return NextResponse.json({ ok: false }, { status: 404 })
    return NextResponse.json({ ok: true, adminKundId })
  } catch (error) {
    if (error instanceof KundArendeFel) {
      return NextResponse.json({ ok: false }, { status: error.status })
    }
    console.error('Kunde inte slå upp kund för ärendenummer.', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

function verifieraHemlighet(request: NextRequest): 200 | 401 | 500 {
  const konfigureradHemlighet = process.env.ADMINPORTAL_INTAG_SECRET
  if (!konfigureradHemlighet) {
    console.error('ADMINPORTAL_INTAG_SECRET saknas – ärendenummer-uppslag kan inte verifiera anrop.')
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
