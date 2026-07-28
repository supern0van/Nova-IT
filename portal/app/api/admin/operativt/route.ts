import { NextResponse, type NextRequest } from 'next/server'

import { harAdminAtkomst } from '@/lib/auth/profiler-server'
import { hamtaOperativAdminData } from '@/lib/admin/operativa-server'
import { hamtaAutentiseradAnvandarId } from '@/lib/supabase/route-anvandare'

export async function GET(request: NextRequest) {
  const anvandareId = await hamtaAutentiseradAnvandarId(request)

  if (!anvandareId) {
    return NextResponse.json({ kunder: [], arenden: [], bokningar: [] }, { status: 401 })
  }

  let arAdmin = false
  try {
    arAdmin = await harAdminAtkomst(anvandareId)
  } catch {
    return NextResponse.json({ kunder: [], arenden: [], bokningar: [] }, { status: 500 })
  }

  if (!arAdmin) {
    return NextResponse.json({ kunder: [], arenden: [], bokningar: [] }, { status: 403 })
  }

  try {
    return NextResponse.json(await hamtaOperativAdminData())
  } catch {
    return NextResponse.json({ kunder: [], arenden: [], bokningar: [] }, { status: 500 })
  }
}
