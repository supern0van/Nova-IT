import { NextResponse, type NextRequest } from 'next/server'

import { byggLosenordsAterstallningsUrl } from '@/lib/admin/admin-url'
import { arSystemRoll } from '@/lib/auth/roll'
import {
  bjudInPortalProfil,
  harAdminAtkomst,
  listaProfilerFranDatabasen,
} from '@/lib/auth/profiler-server'
import { hamtaAutentiseradAnvandarId } from '@/lib/supabase/route-anvandare'

export async function GET(request: NextRequest) {
  const anvandareId = await hamtaAutentiseradAnvandarId(request)

  if (!anvandareId) {
    return NextResponse.json({ profiler: [] }, { status: 401 })
  }

  const arAdmin = await harAdminAtkomst(anvandareId)
  if (!arAdmin) {
    return NextResponse.json({ profiler: [] }, { status: 403 })
  }

  try {
    const profiler = await listaProfilerFranDatabasen()
    return NextResponse.json({ profiler })
  } catch {
    return NextResponse.json({ profiler: [] }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const anvandareId = await hamtaAutentiseradAnvandarId(request)

  if (!anvandareId) {
    return NextResponse.json({ profil: null }, { status: 401 })
  }

  const arAdmin = await harAdminAtkomst(anvandareId)
  if (!arAdmin) {
    return NextResponse.json({ profil: null }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ profil: null, fel: 'Ogiltig JSON.' }, { status: 400 })
  }

  const epost = typeof body === 'object' && body !== null && 'epost' in body ? body.epost : null
  const namn = typeof body === 'object' && body !== null && 'namn' in body ? body.namn : null
  const roll = typeof body === 'object' && body !== null && 'roll' in body ? body.roll : null

  if (!arGiltigEpost(epost) || !arGiltigtNamn(namn) || !arSystemRoll(roll)) {
    return NextResponse.json(
      {
        profil: null,
        fel: 'Ange namn, giltig e-postadress och systemroll.',
      },
      { status: 400 },
    )
  }

  try {
    const resultat = await bjudInPortalProfil({
      epost,
      namn,
      roll,
      redirectTo: byggLosenordsAterstallningsUrl(request),
    })

    if (!resultat.ok) {
      const status = resultat.fel === 'finns_redan' ? 409 : 500
      return NextResponse.json({ profil: null, fel: resultat.fel }, { status })
    }

    return NextResponse.json({ profil: resultat.profil }, { status: 201 })
  } catch {
    return NextResponse.json({ profil: null }, { status: 500 })
  }
}

function arGiltigEpost(varde: unknown): varde is string {
  return (
    typeof varde === 'string' &&
    varde.trim().length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(varde.trim())
  )
}

function arGiltigtNamn(varde: unknown): varde is string {
  if (typeof varde !== 'string') return false
  const namn = varde.trim()
  return namn.length >= 2 && namn.length <= 120
}
