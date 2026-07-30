import { NextResponse, type NextRequest } from 'next/server'

import { uppdateraKontaktpreferenser } from '@/lib/admin/operativa-server'

/**
 * Tar emot kundens kontaktpreferenser från kundportalen (se
 * Nova-IT-Kundportal, app/kontaktinstallningar/page.tsx +
 * app/api/kund/kontaktpreferenser/route.ts). Kundportalen är källan till
 * sanning - den här endpointen bara speglar värdena till admin_kunder så
 * att adminportalen kan låsa SMS-knappen och hoppa över mailavisering utan
 * ett extra anrop per ärendesvar. Samma hemlighetsskydd som
 * ../kundmeddelande/route.ts.
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
    typeof payload.kontaktUppdateringEpost !== 'boolean' ||
    typeof payload.kontaktUppdateringSms !== 'boolean' ||
    typeof payload.kontaktKlartEpost !== 'boolean' ||
    typeof payload.kontaktKlartSms !== 'boolean'
  ) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const uppdaterad = await uppdateraKontaktpreferenser({
    adminKundId: payload.adminKundId,
    kontaktUppdateringEpost: payload.kontaktUppdateringEpost,
    kontaktUppdateringSms: payload.kontaktUppdateringSms,
    kontaktKlartEpost: payload.kontaktKlartEpost,
    kontaktKlartSms: payload.kontaktKlartSms,
  })

  if (!uppdaterad) return NextResponse.json({ ok: false }, { status: 500 })
  return NextResponse.json({ ok: true })
}

function verifieraHemlighet(request: NextRequest): 200 | 401 | 500 {
  const konfigureradHemlighet = process.env.ADMINPORTAL_INTAG_SECRET
  if (!konfigureradHemlighet) {
    console.error('ADMINPORTAL_INTAG_SECRET saknas – kundpreferenser-API:et kan inte verifiera anrop.')
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
