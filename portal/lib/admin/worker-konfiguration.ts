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
  'ADMIN_SESSION_LEASE_SECRET',
  'INTAG_SECRET',
  'ELKS_API_USERNAME',
  'ELKS_API_PASSWORD',
  'RESEND_API_KEY',
  'ARENDE_AVISERING_FROM',
] as const
