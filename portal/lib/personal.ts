import type { Anvandare } from '@/lib/types'

/**
 * Rena hjälpfunktioner för personal-/teknikertilldelning. Ersätter de
 * data+logik-sammanflätade funktionerna som tidigare fanns i
 * `lib/auth/demo-auth.ts` (som läste `demoAnvandare` direkt). Personalen
 * kommer numera från `public.profiles` via `/api/admin/operativt` (se
 * `lib/admin/operativa-server.ts`) och flödar in som `db.personal` –
 * dessa funktioner tar den listan som parameter i stället för att hämta
 * den själva, så att komponenterna alltid visar samma personal som
 * servern faktiskt känner till.
 */

export function personalNamn(personal: Anvandare[], id: string | null | undefined): string {
  if (!id) return 'Ej tilldelad'
  return personal.find((p) => p.id === id)?.namn ?? 'Okänd användare'
}

export function personalInitialer(personal: Anvandare[], id: string | null | undefined): string {
  if (!id) return '–'
  return personal.find((p) => p.id === id)?.initialer ?? '?'
}

/** Aktiv personal som kan tilldelas ärenden och bokningar. */
export function tilldelningsbarPersonal(personal: Anvandare[]): Anvandare[] {
  return personal.filter((p) => p.aktiv)
}

/**
 * Initialer från ett fritextnamn – första bokstaven i första och sista
 * ordet, eller de två första bokstäverna om namnet bara är ett ord.
 */
export function initialerFranNamn(namn: string): string {
  const delar = namn.trim().split(/\s+/).filter(Boolean)
  if (delar.length === 0) return '?'
  if (delar.length === 1) return delar[0].slice(0, 2).toUpperCase()
  return (delar[0][0] + delar[delar.length - 1][0]).toUpperCase()
}
