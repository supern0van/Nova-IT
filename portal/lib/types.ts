/**
 * Domändefinitioner för Nova IT:s adminportal.
 *
 * Dessa typer är avsiktligt fristående från datalagret. När demolagringen
 * (localStorage) byts mot en riktig databas ska dessa typer kunna återanvändas
 * mer eller mindre oförändrade.
 */

export type Roll = 'administrator' | 'tekniker'

export type ArendeStatus =
  | 'ny'
  | 'pagaende'
  | 'vantar_pa_kund'
  | 'bokad'
  | 'lost'
  | 'stangd'

export type Prioritet = 'lag' | 'normal' | 'hog' | 'kritisk'

export type Kundtyp = 'privatperson' | 'verksamhet'

export type Kategori =
  | 'datorer_vardags_it'
  | 'natverk_wifi'
  | 'konton_moln_sakerhet'
  | 'installation'
  | 'sakerhet_virus'

export type Kanal = 'kontaktformular' | 'supportassistent' | 'telefon' | 'e-post'

export type BokningTyp = 'hembesok' | 'distanssupport' | 'verkstadsbesok' | 'telefonkontakt'

export type BokningStatus = 'planerad' | 'bekraftad' | 'genomford' | 'avbokad'

export interface Anvandare {
  id: string
  namn: string
  epost: string
  roll: Roll
  initialer: string
  titel: string
  aktiv: boolean
}

export interface Kund {
  id: string
  namn: string
  kundtyp: Kundtyp
  organisation?: string
  orgnummer?: string
  epost: string
  telefon: string
  adress: string
  ort: string
  kontaktperson?: string
  senasteKontakt: string
  interntAnteckning?: string
  skapad: string
}

/**
 * Intern anteckning på kundnivå (till skillnad från `Meddelande` som hör till
 * ett enskilt ärende). Syns aldrig för kunden.
 */
export interface Kundanteckning {
  id: string
  kundId: string
  text: string
  forfattare: string
  skapad: string
  uppdaterad?: string
}

export interface Meddelande {
  id: string
  arendeId: string
  /** 'kund' = inkommande, 'personal' = svar ut till kund. */
  avsandare: 'kund' | 'personal' | 'assistent'
  avsandareNamn: string
  text: string
  tidpunkt: string
  /** true = endast synligt internt (intern anteckning). */
  internt: boolean
}

export interface Bilaga {
  id: string
  namn: string
  storlek: string
  typ: string
  uppladdad: string
}

export interface Aktivitet {
  id: string
  arendeId: string
  typ:
    | 'skapat'
    | 'status'
    | 'prioritet'
    | 'tilldelning'
    | 'meddelande'
    | 'anteckning'
    | 'bokning'
    | 'bilaga'
    | 'sms'
  beskrivning: string
  aktor: string
  tidpunkt: string
}

export interface Bokning {
  id: string
  arendeId?: string
  arendenummer?: string
  kundId: string
  kundNamn: string
  typ: BokningTyp
  status: BokningStatus
  datum: string
  tid: string
  langdMinuter: number
  tekniker: string
  plats: string
  notering?: string
}

export interface Arende {
  id: string
  arendenummer: string
  rubrik: string
  kundId: string
  kundNamn: string
  kundtyp: Kundtyp
  organisation?: string
  epost: string
  telefon: string
  kategori: Kategori
  underkategori: string
  status: ArendeStatus
  prioritet: Prioritet
  ansvarigId: string | null
  kanal: Kanal
  beskrivning: string
  assistentSammanfattning?: string
  bilagor: Bilaga[]
  skapad: string
  uppdaterad: string
  sistaSvar?: string
}

export interface Arendekategori {
  id: string
  namn: string
  nyckel: Kategori
  underkategorier: string[]
  standardPrioritet: Prioritet
  aktiv: boolean
}

export interface Standardsvar {
  id: string
  rubrik: string
  text: string
  kategori: string
}

export interface Aviseringsinstallning {
  id: string
  namn: string
  beskrivning: string
  aktiv: boolean
}

export interface EpostMottagare {
  id: string
  epost: string
  syfte: string
  aktiv: boolean
}
