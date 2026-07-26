import type {
  ArendeStatus,
  BokningStatus,
  BokningTyp,
  Kanal,
  Kategori,
  Kundtyp,
  Prioritet,
  Roll,
} from '@/lib/types'

/** Svenska etiketter + återhållsam statusfärgsättning för hela portalen. */

export const statusLabel: Record<ArendeStatus, string> = {
  ny: 'Ny',
  pagaende: 'Pågående',
  vantar_pa_kund: 'Väntar på kund',
  bokad: 'Bokad',
  lost: 'Löst',
  stangd: 'Stängd',
}

export const statusOrdning: ArendeStatus[] = [
  'ny',
  'pagaende',
  'vantar_pa_kund',
  'bokad',
  'lost',
  'stangd',
]

/**
 * Statusfärger hålls avsiktligt dämpade: en tonad yta och en punkt i full
 * kulör, istället för färgade block som konkurrerar med innehållet.
 */
export const statusDot: Record<ArendeStatus, string> = {
  ny: 'bg-primary',
  pagaende: 'bg-info',
  vantar_pa_kund: 'bg-warning',
  bokad: 'bg-chart-5',
  lost: 'bg-success',
  stangd: 'bg-muted-foreground',
}

export const statusChip: Record<ArendeStatus, string> = {
  ny: 'bg-primary/12 text-primary',
  pagaende: 'bg-info/12 text-info',
  vantar_pa_kund: 'bg-warning/12 text-warning',
  bokad: 'bg-chart-5/18 text-text-secondary',
  lost: 'bg-success/12 text-success',
  stangd: 'bg-muted text-muted-foreground',
}

export const prioritetLabel: Record<Prioritet, string> = {
  lag: 'Låg',
  normal: 'Normal',
  hog: 'Hög',
  kritisk: 'Kritisk',
}

export const prioritetOrdning: Prioritet[] = ['lag', 'normal', 'hog', 'kritisk']

export const prioritetVikt: Record<Prioritet, number> = {
  kritisk: 4,
  hog: 3,
  normal: 2,
  lag: 1,
}

export const prioritetChip: Record<Prioritet, string> = {
  lag: 'bg-muted text-muted-foreground',
  normal: 'bg-secondary text-text-secondary',
  hog: 'bg-warning/14 text-warning',
  kritisk: 'bg-destructive/16 text-destructive',
}

export const prioritetDot: Record<Prioritet, string> = {
  lag: 'bg-muted-foreground',
  normal: 'bg-chart-5',
  hog: 'bg-warning',
  kritisk: 'bg-destructive',
}

export const kundtypLabel: Record<Kundtyp, string> = {
  privatperson: 'Privatperson',
  verksamhet: 'Verksamhet',
}

export const kategoriLabel: Record<Kategori, string> = {
  datorer_vardags_it: 'Datorer och vardags-IT',
  natverk_wifi: 'Nätverk och Wi-Fi',
  konton_moln_sakerhet: 'Konton, moln och säkerhet',
  installation: 'Installation och flytt',
  sakerhet_virus: 'Virus och säkerhetsincident',
}

export const kanalLabel: Record<Kanal, string> = {
  kontaktformular: 'Kontaktformulär',
  supportassistent: 'Supportassistent',
  telefon: 'Telefon',
  'e-post': 'E-post',
}

export const bokningTypLabel: Record<BokningTyp, string> = {
  hembesok: 'Hembesök',
  distanssupport: 'Distanssupport',
  verkstadsbesok: 'Verkstadsbesök',
  telefonkontakt: 'Telefonkontakt',
}

export const bokningStatusLabel: Record<BokningStatus, string> = {
  planerad: 'Planerad',
  bekraftad: 'Bekräftad',
  genomford: 'Genomförd',
  avbokad: 'Avbokad',
}

export const bokningStatusChip: Record<BokningStatus, string> = {
  planerad: 'bg-secondary text-text-secondary',
  bekraftad: 'bg-success/12 text-success',
  genomford: 'bg-muted text-muted-foreground',
  avbokad: 'bg-destructive/14 text-destructive',
}

export const rollLabel: Record<Roll, string> = {
  administrator: 'Administratör',
  tekniker: 'Tekniker',
}

/** Relativ tid på svenska, t.ex. "för 12 min sedan". */
export function relativTid(iso: string): string {
  const nu = Date.now()
  const då = new Date(iso).getTime()
  const diff = Math.max(0, nu - då)
  const min = Math.floor(diff / 60000)

  if (min < 1) return 'nyss'
  if (min < 60) return `för ${min} min sedan`
  const timmar = Math.floor(min / 60)
  if (timmar < 24) return `för ${timmar} ${timmar === 1 ? 'timme' : 'timmar'} sedan`
  const dagar = Math.floor(timmar / 24)
  if (dagar < 7) return `för ${dagar} ${dagar === 1 ? 'dag' : 'dagar'} sedan`
  const veckor = Math.floor(dagar / 7)
  if (veckor < 5) return `för ${veckor} ${veckor === 1 ? 'vecka' : 'veckor'} sedan`
  const manader = Math.floor(dagar / 30)
  return `för ${manader} ${manader === 1 ? 'månad' : 'månader'} sedan`
}

export function formateraDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formateraDatumTid(iso: string): string {
  return new Date(iso).toLocaleString('sv-SE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formateraKlockslag(iso: string): string {
  return new Date(iso).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "onsdag 12 mars" – används i bokningsvyn. */
export function formateraVeckodag(datum: string): string {
  return new Date(datum).toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
