import type { User } from '@supabase/supabase-js'

import { arAdministrator, type SystemRoll } from '@/lib/auth/roll'
import { hamtaRollFranDatabasen } from '@/lib/auth/roll-server'
import { skapaSupabaseServiceklient } from '@/lib/supabase/service'

export interface KontoHalsa {
  epostBekraftad: boolean | null
  senastInloggad: string | null
  authSkapad: string | null
}

export interface ProfilRad {
  id: string
  epost: string
  namn: string
  roll: SystemRoll
  skapad: string
  uppdaterad: string
  kontoHalsa?: KontoHalsa | null
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

  const profiler = (data ?? []) as ProfilRad[]
  const authAnvandare = await listaAuthAnvandare()
  const authKarta = new Map(authAnvandare.map((user) => [user.id, user]))

  return profiler.map((profil) => ({
    ...profil,
    kontoHalsa: kontoHalsaFranAuthAnvandare(authKarta.get(profil.id)),
  }))
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

async function listaAuthAnvandare(): Promise<User[]> {
  try {
    const supabase = skapaSupabaseServiceklient()
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (error) return []
    return data.users
  } catch {
    return []
  }
}

function kontoHalsaFranAuthAnvandare(user: User | undefined): KontoHalsa | null {
  if (!user) return null

  return {
    epostBekraftad: Boolean(user.email_confirmed_at ?? user.confirmed_at),
    senastInloggad: user.last_sign_in_at ?? null,
    authSkapad: user.created_at ?? null,
  }
}
