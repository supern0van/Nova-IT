export const adminWorkerNamn = 'nova-it-admin'

export const adminWorkerWorkersDevAktiv = true

export const adminWorkerDomäner = [
  'admin.nova-it.se',
  'admin.novait.se',
  'portal.novait.se',
  'portal.nova-it.se',
] as const

export const obligatoriskaWorkerSecrets = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const
