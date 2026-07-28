import { arSystemRoll, type SystemRoll } from '@/lib/auth/roll'

export interface ProfilRad {
  id: string
  epost: string
  namn: string
  roll: SystemRoll
  skapad: string
  uppdaterad: string
  kontoHalsa?: {
    epostBekraftad: boolean | null
    senastInloggad: string | null
    authSkapad: string | null
    mfaAntalFaktorer?: number | null
    mfaVerifieradeFaktorer?: number | null
  } | null
}

export type SystemStatusNiva = 'ok' | 'varning' | 'fel'

export interface SystemStatusKontroll {
  id: string
  namn: string
  status: SystemStatusNiva
  beskrivning: string
}

export interface SystemStatusSvar {
  kontroller: SystemStatusKontroll[]
  profiler: {
    antal: number | null
    status: SystemStatusNiva
  }
}

export interface MfaAterstallningApiSvar {
  ok: boolean
  fel?: string
  antalBorttagnaFaktorer?: number
}

export interface LosenordsAterstallningApiSvar {
  ok: boolean
  fel?: string
  epost?: string
}

export function hamtaProfilerFranApiSvar(data: unknown): ProfilRad[] | null {
  if (typeof data !== 'object' || data === null || !('profiler' in data)) return null
  if (!Array.isArray(data.profiler)) return null

  const profiler = data.profiler.map(normaliseraProfilRad)
  if (!profiler.every(arProfilRad)) return null
  return profiler
}

export function hamtaProfilFranApiSvar(data: unknown): ProfilRad | null {
  if (typeof data !== 'object' || data === null || !('profil' in data)) return null
  return normaliseraProfilRad(data.profil)
}

export function hamtaSystemStatusFranApiSvar(data: unknown): SystemStatusSvar | null {
  if (typeof data !== 'object' || data === null || !('status' in data)) return null
  return normaliseraSystemStatus(data.status)
}

export function hamtaMfaAterstallningFranApiSvar(
  data: unknown,
): MfaAterstallningApiSvar | null {
  if (typeof data !== 'object' || data === null || !('ok' in data)) return null
  if (typeof data.ok !== 'boolean') return null

  const fel = 'fel' in data ? normaliseraValfriString(data.fel) : undefined
  const antalBorttagnaFaktorer =
    'antalBorttagnaFaktorer' in data
      ? normaliseraValfrittHeltal(data.antalBorttagnaFaktorer)
      : undefined
  if (fel === false || antalBorttagnaFaktorer === false) return null

  return {
    ok: data.ok,
    ...(fel === undefined ? {} : { fel }),
    ...(antalBorttagnaFaktorer === undefined ? {} : { antalBorttagnaFaktorer }),
  }
}

export function hamtaLosenordsAterstallningFranApiSvar(
  data: unknown,
): LosenordsAterstallningApiSvar | null {
  if (typeof data !== 'object' || data === null || !('ok' in data)) return null
  if (typeof data.ok !== 'boolean') return null

  const fel = 'fel' in data ? normaliseraValfriString(data.fel) : undefined
  const epost = 'epost' in data ? normaliseraValfriString(data.epost) : undefined
  if (fel === false || epost === false) return null

  return {
    ok: data.ok,
    ...(fel === undefined ? {} : { fel }),
    ...(epost === undefined ? {} : { epost }),
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

  const kontoHalsa = 'kontoHalsa' in data ? normaliseraKontoHalsa(data.kontoHalsa) : undefined
  if (kontoHalsa === false) return null

  return {
    id: data.id,
    epost: data.epost,
    namn: data.namn,
    roll: data.roll,
    skapad: data.skapad,
    uppdaterad: data.uppdaterad,
    ...(kontoHalsa === undefined ? {} : { kontoHalsa }),
  }
}

function normaliseraKontoHalsa(data: unknown): ProfilRad['kontoHalsa'] | false {
  if (data === null || data === undefined) return null
  if (typeof data !== 'object') return false
  if (!('epostBekraftad' in data) || !('senastInloggad' in data) || !('authSkapad' in data)) {
    return false
  }

  if (
    !arBooleanEllerNull(data.epostBekraftad) ||
    !arStringEllerNull(data.senastInloggad) ||
    !arStringEllerNull(data.authSkapad)
  ) {
    return false
  }

  const mfaAntalFaktorer =
    'mfaAntalFaktorer' in data ? normaliseraValfrittNummer(data.mfaAntalFaktorer) : undefined
  const mfaVerifieradeFaktorer =
    'mfaVerifieradeFaktorer' in data
      ? normaliseraValfrittNummer(data.mfaVerifieradeFaktorer)
      : undefined
  if (mfaAntalFaktorer === false || mfaVerifieradeFaktorer === false) return false

  return {
    epostBekraftad: data.epostBekraftad,
    senastInloggad: data.senastInloggad,
    authSkapad: data.authSkapad,
    ...(mfaAntalFaktorer === undefined ? {} : { mfaAntalFaktorer }),
    ...(mfaVerifieradeFaktorer === undefined ? {} : { mfaVerifieradeFaktorer }),
  }
}

function normaliseraSystemStatus(data: unknown): SystemStatusSvar | null {
  if (typeof data !== 'object' || data === null) return null
  if (!('kontroller' in data) || !('profiler' in data)) return null
  if (!Array.isArray(data.kontroller)) return null

  const kontroller = data.kontroller.map(normaliseraSystemStatusKontroll)
  if (!kontroller.every(arSystemStatusKontroll)) return null

  const profiler = normaliseraProfilerStatus(data.profiler)
  if (!profiler) return null

  return {
    kontroller,
    profiler,
  }
}

function normaliseraSystemStatusKontroll(data: unknown): SystemStatusKontroll | null {
  if (typeof data !== 'object' || data === null) return null
  if (!('id' in data) || !('namn' in data) || !('status' in data) || !('beskrivning' in data)) {
    return null
  }

  if (
    typeof data.id !== 'string' ||
    typeof data.namn !== 'string' ||
    !arSystemStatusNiva(data.status) ||
    typeof data.beskrivning !== 'string'
  ) {
    return null
  }

  return {
    id: data.id,
    namn: data.namn,
    status: data.status,
    beskrivning: data.beskrivning,
  }
}

function normaliseraProfilerStatus(data: unknown): SystemStatusSvar['profiler'] | null {
  if (typeof data !== 'object' || data === null || !('antal' in data) || !('status' in data)) {
    return null
  }
  if (!arSystemStatusNiva(data.status)) return null
  if (data.antal !== null && typeof data.antal !== 'number') return null

  return {
    antal: data.antal,
    status: data.status,
  }
}

function arSystemStatusNiva(data: unknown): data is SystemStatusNiva {
  return data === 'ok' || data === 'varning' || data === 'fel'
}

function arProfilRad(data: ProfilRad | null): data is ProfilRad {
  return data !== null
}

function arSystemStatusKontroll(
  data: SystemStatusKontroll | null,
): data is SystemStatusKontroll {
  return data !== null
}

function arStringEllerNull(data: unknown): data is string | null {
  return typeof data === 'string' || data === null
}

function arBooleanEllerNull(data: unknown): data is boolean | null {
  return typeof data === 'boolean' || data === null
}

function normaliseraValfriString(data: unknown): string | undefined | false {
  if (data === undefined) return undefined
  if (typeof data === 'string') return data
  return false
}

function normaliseraValfrittNummer(data: unknown): number | null | false {
  if (data === null || typeof data === 'number') return data
  return false
}

function normaliseraValfrittHeltal(data: unknown): number | undefined | false {
  if (data === undefined) return undefined
  if (typeof data === 'number' && Number.isInteger(data) && data >= 0) return data
  return false
}
