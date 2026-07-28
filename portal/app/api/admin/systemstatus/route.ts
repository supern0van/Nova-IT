import { NextResponse, type NextRequest } from 'next/server'

import { harAdminAtkomst } from '@/lib/auth/profiler-server'
import { hamtaSystemStatus } from '@/lib/admin/system-status-server'
import { hamtaAutentiseradAnvandarId } from '@/lib/supabase/route-anvandare'

export async function GET(request: NextRequest) {
  const anvandareId = await hamtaAutentiseradAnvandarId(request)

  if (!anvandareId) {
    return NextResponse.json({ status: null }, { status: 401 })
  }

  const arAdmin = await harAdminAtkomst(anvandareId)
  if (!arAdmin) {
    return NextResponse.json({ status: null }, { status: 403 })
  }

  try {
    const status = await hamtaSystemStatus()
    return NextResponse.json({ status })
  } catch {
    return NextResponse.json({ status: null }, { status: 500 })
  }
}
