import { NextResponse, type NextRequest } from 'next/server'

import { harAdminAtkomst, uppdateraProfilRollIDatabasen } from '@/lib/auth/profiler-server'
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

  const { id } = await params
  if (id === anvandareId) {
    return NextResponse.json({ profil: null }, { status: 400 })
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

  const roll = typeof body === 'object' && body !== null && 'roll' in body ? body.roll : null
  if (!arSystemRoll(roll)) {
    return NextResponse.json({ profil: null }, { status: 400 })
  }

  const profil = await uppdateraProfilRollIDatabasen(id, roll)
  if (!profil) {
    return NextResponse.json({ profil: null }, { status: 404 })
  }

  return NextResponse.json({ profil })
}
