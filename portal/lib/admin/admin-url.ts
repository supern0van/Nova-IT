import { adminWorkerDomäner } from '@/lib/admin/worker-konfiguration'

interface RequestMedNextUrl {
  nextUrl: {
    hostname: string
    origin: string
  }
}

const standardAdminOrigin = 'https://admin.nova-it.se'

export function hamtaSakerAdminOrigin(request: RequestMedNextUrl): string {
  const hostname = request.nextUrl.hostname.toLowerCase()

  if (adminWorkerDomäner.some((domän) => domän.toLowerCase() === hostname) && arHttpsOrigin(request.nextUrl.origin)) {
    return request.nextUrl.origin
  }

  return standardAdminOrigin
}

export function byggLosenordsAterstallningsUrl(request: RequestMedNextUrl): string {
  return new URL('/logga-in?aterstall=1', hamtaSakerAdminOrigin(request)).toString()
}

function arHttpsOrigin(origin: string): boolean {
  try {
    return new URL(origin).protocol === 'https:'
  } catch {
    return false
  }
}
