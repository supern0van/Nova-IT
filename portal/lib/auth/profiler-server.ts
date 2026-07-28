import type { User } from '@supabase/supabase-js'

import { arAdministrator, arSystemRoll, type SystemRoll } from '@/lib/auth/roll'
import { hamtaRollFranDatabasen } from '@/lib/auth/roll-server'
import { skapaSupabaseServiceklient } from '@/lib/supabase/service'

export interface KontoHalsa {
  epostBekraftad: boolean | null
  senastInloggad: string | null
  authSkapad: string | null
  mfaAntalFaktorer?: number | null
  mfaVerifieradeFaktorer?: number | null
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

interface MfaHalsa {
  antalFaktorer: number | null
  verifieradeFaktorer: number | null
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

export type LösenordsåterställningResultat =
  | { ok: true; epost: string }
  | { ok: false; fel: 'profil_saknas' | 'kunde_inte_skicka' }

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

  const profiler = (data ?? []).flatMap((rad) => {
    const profil = normaliseraProfilRad(rad)
    return profil ? [profil] : []
  })
  const authAnvandare = await listaAuthAnvandare()
  const authKarta = new Map(authAnvandare.map((user) => [user.id, user]))
  const mfaKarta = await listaMfaHalsa(profiler.map((profil) => profil.id))

  return profiler.map((profil) => ({
    ...profil,
    kontoHalsa: kontoHalsaFranAuthAnvandare(authKarta.get(profil.id), mfaKarta.get(profil.id)),
  }))
}

export async function uppdateraProfilRollIDatabasen(
  profilId: string,
  roll: SystemRoll,
): Promise<ProfilRad | null> {
  if (!arGiltigtProfilId(profilId) || !arSystemRoll(roll)) return null

  const supabase = skapaSupabaseServiceklient()
  const { data, error } = await supabase
    .from('profiles')
    .update({ roll })
    .eq('id', profilId)
    .select('id, epost, namn, roll, skapad, uppdaterad')
    .maybeSingle()

  if (error || !data) return null
  return normaliseraProfilRad(data)
}

export async function uppdateraProfilNamnIDatabasen(
  profilId: string,
  namn: string,
): Promise<ProfilRad | null> {
  if (!arGiltigtProfilId(profilId) || !arGiltigtNamn(namn)) return null

  const supabase = skapaSupabaseServiceklient()
  const normaliseratNamn = namn.trim()

  const { data: authData, error: hamtaAuthFel } = await supabase.auth.admin.getUserById(profilId)
  const user = authData.user
  if (hamtaAuthFel || !user) return null

  const userMetadata =
    typeof user.user_metadata === 'object' && user.user_metadata !== null ? user.user_metadata : {}
  const { error: authFel } = await supabase.auth.admin.updateUserById(profilId, {
    user_metadata: {
      ...userMetadata,
      namn: normaliseratNamn,
      full_name: normaliseratNamn,
    },
  })

  if (authFel) return null

  const { data, error } = await supabase
    .from('profiles')
    .update({ namn: normaliseratNamn })
    .eq('id', profilId)
    .select('id, epost, namn, roll, skapad, uppdaterad')
    .maybeSingle()

  const profil = normaliseraProfilRad(data)
  if (error || !profil) return null
  return {
    ...profil,
    kontoHalsa: kontoHalsaFranAuthAnvandare(user),
  }
}

export async function bjudInPortalProfil({
  epost,
  namn,
  roll,
  redirectTo,
}: NyPortalProfil): Promise<BjudInPortalProfilResultat> {
  const normaliseradEpost = epost.trim().toLowerCase()
  const normaliseratNamn = namn.trim()
  if (!arGiltigEpost(normaliseradEpost) || !arGiltigtNamn(normaliseratNamn) || !arSystemRoll(roll)) {
    return { ok: false, fel: 'kunde_inte_spara_profil' }
  }

  const supabase = skapaSupabaseServiceklient()

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

  const sparadProfil = normaliseraProfilRad(profil)
  if (profilFel || !sparadProfil) {
    return { ok: false, fel: 'kunde_inte_spara_profil' }
  }

  return {
    ok: true,
    profil: {
      ...sparadProfil,
      kontoHalsa: kontoHalsaFranAuthAnvandare(user),
    },
  }
}

export async function skickaLosenordsaterstallningForProfil(
  profilId: string,
  redirectTo: string,
): Promise<LösenordsåterställningResultat> {
  if (!arGiltigtProfilId(profilId) || !arHttpsUrl(redirectTo)) {
    return { ok: false, fel: 'profil_saknas' }
  }

  const supabase = skapaSupabaseServiceklient()
  const { data: profil, error: profilFel } = await supabase
    .from('profiles')
    .select('epost')
    .eq('id', profilId)
    .maybeSingle()

  const epost =
    typeof profil?.epost === 'string' && profil.epost.trim()
      ? profil.epost.trim().toLowerCase()
      : null

  if (profilFel || !epost) {
    return { ok: false, fel: 'profil_saknas' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(epost, { redirectTo })
  if (error) {
    return { ok: false, fel: 'kunde_inte_skicka' }
  }

  return { ok: true, epost }
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

async function listaMfaHalsa(profilIds: string[]): Promise<Map<string, MfaHalsa>> {
  const supabase = skapaSupabaseServiceklient()
  const resultat: Array<readonly [string, MfaHalsa]> = await Promise.all(
    profilIds.map(async (userId) => {
      try {
        const { data, error } = await supabase.auth.admin.mfa.listFactors({ userId })
        if (error || !data) {
          return [userId, { antalFaktorer: null, verifieradeFaktorer: null }] as const
        }

        const faktorer = data.factors ?? []
        const verifieradeFaktorer = faktorer.filter(
          (faktor) =>
            typeof faktor === 'object' &&
            faktor !== null &&
            'status' in faktor &&
            faktor.status === 'verified',
        ).length

        return [userId, { antalFaktorer: faktorer.length, verifieradeFaktorer }] as const
      } catch {
        return [userId, { antalFaktorer: null, verifieradeFaktorer: null }] as const
      }
    }),
  )

  return new Map(resultat)
}

function kontoHalsaFranAuthAnvandare(user: User | undefined, mfa?: MfaHalsa): KontoHalsa | null {
  if (!user) return null

  return {
    epostBekraftad: Boolean(user.email_confirmed_at ?? user.confirmed_at),
    senastInloggad: user.last_sign_in_at ?? null,
    authSkapad: user.created_at ?? null,
    mfaAntalFaktorer: mfa?.antalFaktorer ?? null,
    mfaVerifieradeFaktorer: mfa?.verifieradeFaktorer ?? null,
  }
}

function normaliseraProfilRad(data: unknown): ProfilRad | null {
  if (typeof data !== 'object' || data === null) return null
  if (
    !('id' in data) ||
    !('epost' in data) ||
    !('namn' in data) ||
    !('roll' in data) ||
    !('skapad' in data) ||
    !('uppdaterad' in data)
  ) {
    return null
  }

  if (
    typeof data.id !== 'string' ||
    typeof data.epost !== 'string' ||
    typeof data.namn !== 'string' ||
    typeof data.skapad !== 'string' ||
    typeof data.uppdaterad !== 'string' ||
    !arSystemRoll(data.roll)
  ) {
    return null
  }

  const id = data.id.trim()
  const epost = data.epost.trim().toLowerCase()
  const namn = data.namn.trim()
  const skapad = data.skapad.trim()
  const uppdaterad = data.uppdaterad.trim()

  if (!id || !epost || !namn || !skapad || !uppdaterad) return null

  return {
    id,
    epost,
    namn,
    roll: data.roll,
    skapad,
    uppdaterad,
  }
}

function arGiltigtProfilId(id: unknown): id is string {
  return typeof id === 'string' && id.trim().length > 0 && id.length <= 128
}

function arGiltigtNamn(namn: unknown): namn is string {
  if (typeof namn !== 'string') return false
  const normaliseratNamn = namn.trim()
  return normaliseratNamn.length >= 2 && normaliseratNamn.length <= 120
}

function arGiltigEpost(epost: unknown): epost is string {
  return (
    typeof epost === 'string' &&
    epost.trim().length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(epost.trim())
  )
}

function arHttpsUrl(varde: unknown): varde is string {
  if (typeof varde !== 'string') return false
  try {
    return new URL(varde).protocol === 'https:'
  } catch {
    return false
  }
}
