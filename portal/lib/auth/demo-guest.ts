/** Avsiktligt isolerat demonstrationskonto – aldrig en produktionsroll. */
export const DEMO_GAST_EPOST = 'guest@nova-it.se'

export function arDemogastEpost(epost: unknown): boolean {
  return typeof epost === 'string' && epost.trim().toLowerCase() === DEMO_GAST_EPOST
}
