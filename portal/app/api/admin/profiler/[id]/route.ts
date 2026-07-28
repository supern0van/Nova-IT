import { NextResponse, type NextRequest } from 'next/server'

import {
  harAdminAtkomst,
  uppdateraProfilNamnIDatabasen,
  uppdateraProfilRollIDatabasen,
} from '@/lib/auth/profiler-server'
import { arSystemRoll } from '@/lib/auth/roll'
import { hamtaAutentiseradAnvandarId } from '@/lib/supabase/route-anvandare'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
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
    return NextResponse.json({ profil: null }, { status: 400 })
  }

  const { id } = await params
  if (!arGiltigtProfilId(id)) {
    return NextResponse.json({ profil: null }, { status: 400 })
  }

  const roll = typeof body === 'object' && body !== null && 'roll' in body ? body.roll : null
  const namn = typeof body === 'object' && body !== null && 'namn' in body ? body.namn : null
  const harRoll = roll !== null
  const harNamn = namn !== null

  if (harRoll === harNamn) {
    return NextResponse.json({ profil: null }, { status: 400 })
  }

  if (harRoll && (id === anvandareId || !arSystemRoll(roll))) {
    return NextResponse.json({ profil: null }, { status: 400 })
  }

  if (harNamn && !arGiltigtNamn(namn)) {
    return NextResponse.json({ profil: null }, { status: 400 })
  }

  let profil = null
  try {
    profil = harRoll
      ? await uppdateraProfilRollIDatabasen(id, roll)
      : arGiltigtNamn(namn)
        ? await uppdateraProfilNamnIDatabasen(id, namn.trim())
        : null
  } catch {
    return NextResponse.json({ profil: null }, { status: 500 })
  }

  if (!profil) {
    return NextResponse.json({ profil: null }, { status: 404 })
  }

  return NextResponse.json({ profil })
}

function arGiltigtNamn(namn: unknown): namn is string {
  if (typeof namn !== 'string') return false
  const normaliseratNamn = namn.trim()
  return normaliseratNamn.length >= 2 && normaliseratNamn.length <= 120
}

function arGiltigtProfilId(id: unknown): id is string {
  return typeof id === 'string' && id.trim().length > 0 && id.length <= 128
}
