import { demoAnvandare } from '@/lib/demo-data'
import type { Anvandare } from '@/lib/types'

/**
 * STATUS: känd, icke-blockerande brist – inte en bugg som ska döljas.
 *
 * Personallistan nedan (`demoAnvandare`) är fortfarande hårdkodad testdata,
 * inte en riktig personalmodell i Supabase. `public.profiles` täcker bara
 * `SystemRoll` (adminpanelens åtkomst), inte den operativa personal-/
 * teknikerrollen (`Roll`/`Behorighet`, se `lib/auth/supabase-auth.ts`) med
 * titel/aktiv-status som ärende- och bokningstilldelning behöver.
 *
 * Att ersätta detta kräver en ny databastabell (schemadesign, migration,
 * RLS-beslut) – ett medvetet beslut utanför den här omgångens
 * behörighets-/skrivvägshärdning, inte något som ska göras i förbigående.
 * Tilldelning fungerar fullt ut mot de konton som redan finns här; det som
 * saknas är att koppla listan till riktiga portalkonton i stället för
 * påhittade namn. Ingen adminfunktion är blockerad av detta.
 */

export {
  authAdapter,
  behorigheter,
  felmeddelanden,
  hamtaIhagkommenEpost,
  harBehorighet,
  rensaIhagkommenEpost,
  sparaIhagkommenEpost,
} from '@/lib/auth/supabase-auth'
export type {
  AuthChangeEventNamn,
  Behorighet,
  InloggningsFel,
  InloggningsResultat,
  Session,
} from '@/lib/auth/supabase-auth'

export function hamtaAnvandare(id: string): Anvandare | undefined {
  return demoAnvandare.find((a) => a.id === id)
}

/** Personallista. Ersätts av en users-/tilldelningstabell i produktion. */
export function listaAnvandare(): Anvandare[] {
  return demoAnvandare
}

/** Aktiv personal som kan tilldelas ärenden och bokningar. */
export function listaTilldelningsbara(): Anvandare[] {
  return demoAnvandare.filter((a) => a.aktiv)
}

export function anvandarNamn(id: string | null | undefined): string {
  if (!id) return 'Ej tilldelad'
  return demoAnvandare.find((a) => a.id === id)?.namn ?? 'Okänd användare'
}

export function anvandarInitialer(id: string | null | undefined): string {
  if (!id) return '–'
  return demoAnvandare.find((a) => a.id === id)?.initialer ?? '?'
}
