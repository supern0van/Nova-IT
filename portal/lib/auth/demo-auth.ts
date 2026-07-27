import { demoAnvandare } from '@/lib/demo-data'
import type { Anvandare } from '@/lib/types'

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
