import { arSystemRoll, type SystemRoll } from '@/lib/auth/roll'

export interface RollApiSvar {
  roll: SystemRoll | null
  profil?: {
    epost: string
    namn: string
  } | null
}

export function hamtaRollFranApiSvar(data: unknown): RollApiSvar | null {
  if (typeof data !== 'object' || data === null || !('roll' in data)) return null
  if (data.roll !== null && !arSystemRoll(data.roll)) return null

  const profil = 'profil' in data ? normaliseraProfil(data.profil) : undefined
  if (profil === false) return null

  return {
    roll: data.roll,
    ...(profil === undefined ? {} : { profil }),
  }
}

function normaliseraProfil(data: unknown): RollApiSvar['profil'] | false {
  if (data === null || data === undefined) return null
  if (typeof data !== 'object') return false
  if (!('epost' in data) || !('namn' in data)) return false
  if (typeof data.epost !== 'string' || typeof data.namn !== 'string') return false

  return {
    epost: data.epost,
    namn: data.namn,
  }
}
