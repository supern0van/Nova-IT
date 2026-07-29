import { NextResponse, type NextRequest } from 'next/server'

import { hamtaAutentiseradAnvandare } from '@/lib/supabase/route-anvandare'

/**
 * Aktivitetsping för server-side session lease. Middleware uppdaterar den
 * signerade HttpOnly-cookien innan denna handler körs; handlern ger dessutom
 * ett separat fail-closed skydd om routen någon gång används utan middleware.
 */
export async function POST(request: NextRequest) {
  const anvandare = await hamtaAutentiseradAnvandare(request, { tillatDemogast: true })
  if (!anvandare) return new NextResponse(null, { status: 401 })
  return new NextResponse(null, { status: 204 })
}
