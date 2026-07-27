import { NextResponse, type NextRequest } from 'next/server'

import { harAdminAtkomst, listaProfilerFranDatabasen } from '@/lib/auth/profiler-server'
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
