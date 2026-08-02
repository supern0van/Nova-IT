import type { NextRequest } from 'next/server'

export function verifieraSameOrigin(request: NextRequest): 200 | 403 {
  return request.headers.get('origin') === request.nextUrl.origin ? 200 : 403
}

export function verifieraJsonContentType(request: NextRequest): 200 | 415 {
  return request.headers.get('content-type')?.toLowerCase().startsWith('application/json') ? 200 : 415
}

export function verifieraBrowserJsonMutation(request: NextRequest): 200 | 403 | 415 {
  const originStatus = verifieraSameOrigin(request)
  if (originStatus !== 200) return originStatus
  return verifieraJsonContentType(request)
}
