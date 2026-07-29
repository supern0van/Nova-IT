import { NextResponse, type NextRequest } from 'next/server'

import { KundArendeFel, skapaKundMeddelande } from '@/lib/admin/kundarenden-server'

/**
 * Tar emot ett kundinitierat svar på ett öppet ärende (Milstolpe 4). Samma
 * hemlighetsskydd som `../kundarenden/route.ts` – se den filen för
 * motivering. `skapaKundMeddelande` verifierar självständigt att ärendet
 * tillhör `adminKundId` och inte är stängt innan något sparas.
 */
export async function POST(request: NextRequest) {
  const hemlighetsstatus = verifieraHemlighet(request)
  if (hemlighetsstatus !== 200) {
    return NextResponse.json({ ok: false }, { status: hemlighetsstatus })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (
    !arObjekt(payload) ||
    typeof payload.adminKundId !== 'string' ||
    !payload.adminKundId ||
    typeof payload.arendeId !== 'string' ||
    !payload.arendeId ||
    typeof payload.text !== 'string'
  ) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  try {
    const meddelande = await skapaKundMeddelande({
      adminKundId: payload.adminKundId,
      arendeId: payload.arendeId,
      text: payload.text,
    })
    return NextResponse.json({ ok: true, meddelande })
  } catch (error) {
    if (error instanceof KundArendeFel) {
      return NextResponse.json({ ok: false }, { status: error.status })
    }
    console.error('Kunde inte spara kundens meddelande.', error)
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

function arObjekt(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null
}
