import { NextResponse, type NextRequest } from 'next/server'

import { byggLosenordsAterstallningsUrl } from '@/lib/admin/admin-url'
import {
  harAdminAtkomst,
  skickaLosenordsaterstallningForProfil,
} from '@/lib/auth/profiler-server'
import { verifieraSameOrigin } from '@/lib/route-sakerhet'
import { hamtaAutentiseradAnvandarId } from '@/lib/supabase/route-anvandare'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const requestStatus = verifieraSameOrigin(request)
  if (requestStatus !== 200) {
    return NextResponse.json({ ok: false }, { status: requestStatus })
  }

  const anvandareId = await hamtaAutentiseradAnvandarId(request)
  if (!anvandareId) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  let arAdmin = false
  try {
    arAdmin = await harAdminAtkomst(anvandareId)
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  if (!arAdmin) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { id } = await params
  if (!arGiltigtProfilId(id)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  let resultat: Awaited<ReturnType<typeof skickaLosenordsaterstallningForProfil>>
  try {
    resultat = await skickaLosenordsaterstallningForProfil(
      id,
      byggLosenordsAterstallningsUrl(request),
    )
  } catch {
    return NextResponse.json(
      { ok: false, fel: 'Kunde inte skicka återställningslänken.' },
      { status: 500 },
    )
  }

  if (!resultat.ok) {
    return NextResponse.json(
      {
        ok: false,
        fel:
          resultat.fel === 'profil_saknas'
            ? 'Hittade inget portalkonto för återställningen.'
            : 'Kunde inte skicka återställningslänken.',
      },
      { status: resultat.fel === 'profil_saknas' ? 404 : 500 },
    )
  }

  return NextResponse.json({ ok: true, epost: resultat.epost })
}

function arGiltigtProfilId(id: unknown): id is string {
  return typeof id === 'string' && id.trim().length > 0 && id.length <= 128
}
