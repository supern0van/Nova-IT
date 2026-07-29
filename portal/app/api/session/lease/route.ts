import { NextResponse, type NextRequest } from 'next/server'

import { hamtaAutentiseradAnvandarId } from '@/lib/supabase/route-anvandare'

/**
 * Aktivitetsping för server-side session lease. Middleware uppdaterar den
 * signerade HttpOnly-cookien innan denna handler körs; handlern ger dessutom
 * ett separat fail-closed skydd om routen någon gång används utan middleware.
 */
export async function POST(request: NextRequest) {
  const anvandarId = await hamtaAutentiseradAnvandarId(request)
  if (!anvandarId) return new NextResponse(null, { status: 401 })
  return new NextResponse(null, { status: 204 })
}
