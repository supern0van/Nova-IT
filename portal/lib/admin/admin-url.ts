import { primarAdminDomän } from '@/lib/admin/worker-konfiguration'

interface RequestMedNextUrl {
  nextUrl: {
    hostname: string
    origin: string
  }
}

const standardAdminOrigin = `https://${primarAdminDomän}`

export function hamtaSakerAdminOrigin(request: RequestMedNextUrl): string {
  // Lösenordsåterställning och andra auth-länkar ska alltid använda den
  // primära hosten. Alternativa hostar får inte skapa separata auth-sessioner.
  return standardAdminOrigin
}

export function byggLosenordsAterstallningsUrl(request: RequestMedNextUrl): string {
  return new URL('/logga-in?aterstall=1', hamtaSakerAdminOrigin(request)).toString()
}
