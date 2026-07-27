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

export interface NyPortalProfil {
  epost: string
  namn: string
  roll: SystemRoll
  redirectTo?: string
}

export type BjudInPortalProfilResultat =
  | { ok: true; profil: ProfilRad }
  | { ok: false; fel: 'finns_redan' | 'kunde_inte_bjuda_in' | 'kunde_inte_spara_profil' }

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

export async function bjudInPortalProfil({
  epost,
  namn,
  roll,
  redirectTo,
}: NyPortalProfil): Promise<BjudInPortalProfilResultat> {
  const supabase = skapaSupabaseServiceklient()
  const normaliseradEpost = epost.trim().toLowerCase()
  const normaliseratNamn = namn.trim()

  const { data: befintligProfil, error: kontrollFel } = await supabase
    .from('profiles')
    .select('id')
    .eq('epost', normaliseradEpost)
    .maybeSingle()

  if (kontrollFel) return { ok: false, fel: 'kunde_inte_spara_profil' }
  if (befintligProfil) return { ok: false, fel: 'finns_redan' }

  const { data: authData, error: inviteFel } = await supabase.auth.admin.inviteUserByEmail(
    normaliseradEpost,
    {
      data: {
        namn: normaliseratNamn,
        full_name: normaliseratNamn,
      },
      redirectTo,
    },
  )

  const user = authData.user
  if (inviteFel || !user?.id) {
    return { ok: false, fel: inviteFel?.status === 422 ? 'finns_redan' : 'kunde_inte_bjuda_in' }
  }

  const { data: profil, error: profilFel } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        epost: normaliseradEpost,
        namn: normaliseratNamn || normaliseradEpost.split('@')[0],
        roll,
      },
      { onConflict: 'id' },
    )
    .select('id, epost, namn, roll, skapad, uppdaterad')
    .maybeSingle()

  if (profilFel || !profil) {
    return { ok: false, fel: 'kunde_inte_spara_profil' }
  }

  return {
    ok: true,
    profil: {
      ...(profil as ProfilRad),
      kontoHalsa: kontoHalsaFranAuthAnvandare(user),
    },
  }
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
