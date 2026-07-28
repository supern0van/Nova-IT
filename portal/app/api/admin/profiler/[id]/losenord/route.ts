import { NextResponse, type NextRequest } from 'next/server'

import { byggLosenordsAterstallningsUrl } from '@/lib/admin/admin-url'
import {
  harAdminAtkomst,
  skickaLosenordsaterstallningForProfil,
} from '@/lib/auth/profiler-server'
import { hamtaAutentiseradAnvandarId } from '@/lib/supabase/route-anvandare'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const anvandareId = await hamtaAutentiseradAnvandarId(request)
  if (!anvandareId) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const arAdmin = await harAdminAtkomst(anvandareId)
  if (!arAdmin) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { id } = await params
  const resultat = await skickaLosenordsaterstallningForProfil(
    id,
    byggLosenordsAterstallningsUrl(request),
  )

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
