export const adminWorkerNamn = 'nova-it-admin'

/** Den enda permanenta adressen för administratörsportalen. */
export const primarAdminDomän = 'admin.nova-it.se'

export const adminWorkerWorkersDevAktiv = false

export const adminWorkerDomäner = [
  primarAdminDomän,
  'admin.novait.se',
] as const

export const obligatoriskaWorkerSecrets = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'INTAG_SECRET',
] as const
