import { arAdministrator, type SystemRoll } from '@/lib/auth/roll'
import { hamtaRollFranDatabasen } from '@/lib/auth/roll-server'
import { skapaSupabaseServiceklient } from '@/lib/supabase/service'

export interface ProfilRad {
  id: string
  epost: string
  namn: string
  roll: SystemRoll
  skapad: string
  uppdaterad: string
}

export async function harAdminAtkomst(anvandareId: string): Promise<boolean> {
  const roll = await hamtaRollFranDatabasen(anvandareId)
  return arAdministrator(roll)
}

export async function listaProfilerFranDatabasen(): Promise<ProfilRad[]> {
  const supabase = skapaSupabaseServiceklient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, epost, namn, roll, skapad, uppdaterad')
    .order('epost', { ascending: true })

  if (error) {
    throw new Error('Kunde inte läsa profiler från Supabase.')
  }

  return (data ?? []) as ProfilRad[]
}

export async function uppdateraProfilRollIDatabasen(
  profilId: string,
  roll: SystemRoll,
): Promise<ProfilRad | null> {
  const supabase = skapaSupabaseServiceklient()
  const { data, error } = await supabase
    .from('profiles')
    .update({ roll })
    .eq('id', profilId)
    .select('id, epost, namn, roll, skapad, uppdaterad')
    .maybeSingle()

  if (error || !data) return null
  return data as ProfilRad
}
