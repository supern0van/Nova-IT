/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  DEMODATALAGER – ERSÄTTS I PRODUKTION                                    ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Ett litet, avsiktligt tråkigt datalager som härmar ett API. Data hämtas från
 * `lib/demo-data.ts`, sparas i localStorage under demosessionen och alla
 * skrivningar går genom asynkrona funktioner med simulerad latens – så att
 * laddningslägen i gränssnittet är verkliga och inte påklistrade.
 *
 * ── Vid övergång till riktig databas ──────────────────────────────────────
 * Varje funktion nedan motsvarar en framtida serveråtgärd. Behåll signaturerna
 * och byt innehållet:
 *
 *   listaArenden()        → SELECT … FROM arenden
 *   uppdateraArende()     → UPDATE arenden SET … WHERE id = $1
 *   laggTillMeddelande()  → INSERT INTO meddelanden …
 *   skapaBokning()        → INSERT INTO bokningar …
 *
 * Filuppladdning (bilagor) är helt attrapp i demon och ska ersättas med
 * Vercel Blob eller motsvarande. E-postutskick sker inte alls.
 */

import {
  demoAktiviteter,
  demoAnvandare,
  demoArenden,
  demoAviseringar,
  demoBokningar,
  demoKategorier,
  demoKundanteckningar,
  demoKunder,
  demoMeddelanden,
  demoMottagare,
  demoStandardsvar,
} from '@/lib/demo-data'
import type {
  Aktivitet,
  Anvandare,
  Arende,
  ArendeStatus,
  Arendekategori,
  Aviseringsinstallning,
  Bokning,
  BokningStatus,
  BokningTyp,
  EpostMottagare,
  Kanal,
  Kategori,
  Kund,
  Kundanteckning,
  Kundtyp,
  Meddelande,
  Prioritet,
  Standardsvar,
} from '@/lib/types'

const LAGER_NYCKEL = 'nova-it.demo-data.v1'

export interface Databas {
  arenden: Arende[]
  kunder: Kund[]
  kundanteckningar: Kundanteckning[]
  meddelanden: Meddelande[]
  aktiviteter: Aktivitet[]
  bokningar: Bokning[]
  kategorier: Arendekategori[]
  standardsvar: Standardsvar[]
  aviseringar: Aviseringsinstallning[]
  mottagare: EpostMottagare[]
  /**
   * Endast använd som lokalt utvecklingsunderlag när det operativa API:t
   * inte går att nå (se hooks/use-operativ-admin-data.ts). I produktion
   * kommer personal alltid från public.profiles via API:t, aldrig härifrån.
   */
  personal: Anvandare[]
}

function nyDatabas(): Databas {
  // Djupkopia så att seed-datan aldrig muteras.
  return structuredClone({
    arenden: demoArenden,
    kunder: demoKunder,
    kundanteckningar: demoKundanteckningar,
    meddelanden: demoMeddelanden,
    aktiviteter: demoAktiviteter,
    bokningar: demoBokningar,
    kategorier: demoKategorier,
    standardsvar: demoStandardsvar,
    aviseringar: demoAviseringar,
    mottagare: demoMottagare,
    personal: demoAnvandare,
  })
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function las(): Databas {
  if (!isBrowser()) return nyDatabas()
  try {
    const rå = window.localStorage.getItem(LAGER_NYCKEL)
    if (!rå) {
      const db = nyDatabas()
      skriv(db)
      return db
    }
    const db = JSON.parse(rå) as Databas
    // Enkel sundhetskontroll: saknas kärntabeller, seeda om.
    if (!Array.isArray(db.arenden) || !Array.isArray(db.kunder)) {
      const färsk = nyDatabas()
      skriv(färsk)
      return färsk
    }
    // Migrering: tabeller som tillkommit efter att sessionen sparades.
    if (!Array.isArray(db.kundanteckningar)) {
      db.kundanteckningar = structuredClone(demoKundanteckningar)
    }
    if (!Array.isArray(db.personal)) {
      db.personal = structuredClone(demoAnvandare)
    }
    return db
  } catch {
    return nyDatabas()
  }
}

function skriv(db: Databas) {
  if (!isBrowser()) return
  window.localStorage.setItem(LAGER_NYCKEL, JSON.stringify(db))
  // Låter alla monterade vyer veta att data ändrats.
  window.dispatchEvent(new CustomEvent('nova-it:data-uppdaterad'))
}

/** Simulerad nätverkslatens. Håller demon trovärdig utan att kännas seg. */
function latens(ms = 260) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

async function skapaViaOperativApi<T>(
  typ:
    | 'skapa_kund'
    | 'skapa_arende'
    | 'skapa_bokning'
    | 'lagg_till_meddelande'
    | 'lagg_till_kundanteckning',
  data: Record<string, unknown>,
  svarsNyckel: string,
): Promise<T | null> {
  if (!isBrowser()) return null

  let svar: Response
  try {
    svar = await fetch('/api/admin/operativt', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ typ, data }),
    })
  } catch {
    // Lokal/offline-fallback: behåll det gamla demoflödet om API:t inte går att nå alls.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Kunde inte nå det operativa API:t.')
    }
    return null
  }

  if (!svar.ok) {
    throw new Error('Kunde inte spara i den operativa databasen.')
  }

  const json = (await svar.json()) as Record<string, unknown>
  if (json.ok !== true || typeof json[svarsNyckel] !== 'object' || json[svarsNyckel] === null) {
    throw new Error('Servern returnerade ett oväntat svar.')
  }

  return json[svarsNyckel] as T
}

async function andraViaOperativApi<T>(
  typ:
    | 'uppdatera_kund'
    | 'uppdatera_bokning'
    | 'avboka_bokning'
    | 'uppdatera_arende'
    | 'uppdatera_kundanteckning'
    | 'ta_bort_kundanteckning'
    | 'skicka_sms'
    | 'skicka_inloggningsuppgifter'
    | 'ta_bort_kund'
    | 'ta_bort_arenden',
  data: Record<string, unknown>,
  svarsNyckel: string,
): Promise<T | null> {
  if (!isBrowser()) return null

  let svar: Response
  try {
    svar = await fetch('/api/admin/operativt', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ typ, data }),
    })
  } catch {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Kunde inte nå det operativa API:t.')
    }
    return null
  }

  if (!svar.ok) {
    throw new Error('Kunde inte spara i den operativa databasen.')
  }

  const json = (await svar.json()) as Record<string, unknown>
  if (json.ok !== true || json[svarsNyckel] === undefined || json[svarsNyckel] === null) {
    throw new Error('Servern returnerade ett oväntat svar.')
  }

  return json[svarsNyckel] as T
}

// ─── Läsning ────────────────────────────────────────────────────────────────

export function hamtaDatabas(): Databas {
  return las()
}

export function aterstallDemodata() {
  if (!isBrowser()) return
  window.localStorage.removeItem(LAGER_NYCKEL)
  skriv(nyDatabas())
}

export function hamtaArende(arendeId: string): Arende | undefined {
  return las().arenden.find((a) => a.id === arendeId)
}

export function hamtaKund(kundId: string): Kund | undefined {
  return las().kunder.find((k) => k.id === kundId)
}

export function hamtaMeddelanden(arendeId: string): Meddelande[] {
  return las()
    .meddelanden.filter((m) => m.arendeId === arendeId)
    .sort((a, b) => +new Date(a.tidpunkt) - +new Date(b.tidpunkt))
}

export function hamtaAktiviteter(arendeId: string): Aktivitet[] {
  return las()
    .aktiviteter.filter((a) => a.arendeId === arendeId)
    .sort((a, b) => +new Date(b.tidpunkt) - +new Date(a.tidpunkt))
}

export function hamtaSenasteAktivitet(antal = 8): Aktivitet[] {
  return las()
    .aktiviteter.slice()
    .sort((a, b) => +new Date(b.tidpunkt) - +new Date(a.tidpunkt))
    .slice(0, antal)
}

export function hamtaBokningarForArende(arendeId: string): Bokning[] {
  return las().bokningar.filter((b) => b.arendeId === arendeId && b.status !== 'avbokad')
}

// ─── Skrivning: ärenden ─────────────────────────────────────────────────────

function loggaAktivitet(
  db: Databas,
  arendeId: string,
  typ: Aktivitet['typ'],
  beskrivning: string,
  aktor: string,
) {
  db.aktiviteter.push({
    id: id('akt'),
    arendeId,
    typ,
    beskrivning,
    aktor,
    tidpunkt: new Date().toISOString(),
  })
}

export async function andraStatus(
  arendeId: string,
  status: ArendeStatus,
  aktor: string,
  franLabel: string,
  tillLabel: string,
) {
  const apiArende = await andraViaOperativApi<Arende>(
    'uppdatera_arende',
    {
      id: arendeId,
      andringar: { status },
      aktivitet: { typ: 'status', beskrivning: `Status ändrades från ${franLabel} till ${tillLabel}`, aktor },
    },
    'arende',
  )
  if (apiArende) {
    const db = las()
    const index = db.arenden.findIndex((a) => a.id === apiArende.id)
    if (index >= 0) db.arenden[index] = apiArende
    skriv(db)
    return
  }

  await latens()
  const db = las()
  const arende = db.arenden.find((a) => a.id === arendeId)
  if (!arende) return
  arende.status = status
  arende.uppdaterad = new Date().toISOString()
  loggaAktivitet(
    db,
    arendeId,
    'status',
    `Status ändrades från ${franLabel} till ${tillLabel}`,
    aktor,
  )
  skriv(db)
}

export async function andraPrioritet(
  arendeId: string,
  prioritet: Prioritet,
  aktor: string,
  franLabel: string,
  tillLabel: string,
) {
  const apiArende = await andraViaOperativApi<Arende>(
    'uppdatera_arende',
    {
      id: arendeId,
      andringar: { prioritet },
      aktivitet: {
        typ: 'prioritet',
        beskrivning: `Prioritet ändrades från ${franLabel} till ${tillLabel}`,
        aktor,
      },
    },
    'arende',
  )
  if (apiArende) {
    const db = las()
    const index = db.arenden.findIndex((a) => a.id === apiArende.id)
    if (index >= 0) db.arenden[index] = apiArende
    skriv(db)
    return
  }

  await latens()
  const db = las()
  const arende = db.arenden.find((a) => a.id === arendeId)
  if (!arende) return
  arende.prioritet = prioritet
  arende.uppdaterad = new Date().toISOString()
  loggaAktivitet(
    db,
    arendeId,
    'prioritet',
    `Prioritet ändrades från ${franLabel} till ${tillLabel}`,
    aktor,
  )
  skriv(db)
}

export async function tilldelaArende(
  arendeId: string,
  ansvarigId: string | null,
  aktor: string,
  ansvarigNamn: string,
) {
  const apiArende = await andraViaOperativApi<Arende>(
    'uppdatera_arende',
    {
      id: arendeId,
      andringar: { ansvarigId },
      aktivitet: {
        typ: 'tilldelning',
        beskrivning: ansvarigId ? `Tilldelades ${ansvarigNamn}` : 'Tilldelningen togs bort',
        aktor,
      },
    },
    'arende',
  )
  if (apiArende) {
    const db = las()
    const index = db.arenden.findIndex((a) => a.id === apiArende.id)
    if (index >= 0) db.arenden[index] = apiArende
    skriv(db)
    return
  }

  await latens()
  const db = las()
  const arende = db.arenden.find((a) => a.id === arendeId)
  if (!arende) return
  arende.ansvarigId = ansvarigId
  arende.uppdaterad = new Date().toISOString()
  loggaAktivitet(
    db,
    arendeId,
    'tilldelning',
    ansvarigId ? `Tilldelades ${ansvarigNamn}` : 'Tilldelningen togs bort',
    aktor,
  )
  skriv(db)
}

/**
 * Lägger till ett meddelande. `internt: true` ger en intern anteckning som
 * aldrig visas för kunden. I en riktig lösning skulle ett externt svar även
 * trigga e-postutskick – det görs inte här.
 */
export async function laggTillMeddelande(
  arendeId: string,
  text: string,
  internt: boolean,
  avsandareNamn: string,
) {
  const apiMeddelande = await skapaViaOperativApi<Meddelande>(
    'lagg_till_meddelande',
    { arendeId, text, internt, avsandareNamn },
    'meddelande',
  )
  if (apiMeddelande) {
    const db = las()
    if (!db.meddelanden.some((m) => m.id === apiMeddelande.id)) {
      db.meddelanden.push(apiMeddelande)
    }
    const arende = db.arenden.find((a) => a.id === arendeId)
    if (arende) {
      const nu = apiMeddelande.tidpunkt
      arende.uppdaterad = nu
      if (!internt) {
        arende.sistaSvar = nu
        if (arende.status === 'ny') arende.status = 'pagaende'
      }
    }
    skriv(db)
    return
  }

  await latens(400)
  const db = las()
  const arende = db.arenden.find((a) => a.id === arendeId)
  if (!arende) return

  const nu = new Date().toISOString()
  db.meddelanden.push({
    id: id('m'),
    arendeId,
    avsandare: 'personal',
    avsandareNamn,
    text: text.trim(),
    tidpunkt: nu,
    internt,
  })

  arende.uppdaterad = nu
  if (!internt) {
    arende.sistaSvar = nu
    // Ett svar ut till kund flyttar automatiskt ärendet framåt.
    if (arende.status === 'ny') arende.status = 'pagaende'
  }

  loggaAktivitet(
    db,
    arendeId,
    internt ? 'anteckning' : 'meddelande',
    internt ? 'Intern anteckning tillagd' : 'Svar skickat till kund',
    avsandareNamn,
  )
  skriv(db)
}

export async function markeraSomLost(arendeId: string, aktor: string) {
  const apiArende = await andraViaOperativApi<Arende>(
    'uppdatera_arende',
    {
      id: arendeId,
      andringar: { status: 'lost' },
      aktivitet: { typ: 'status', beskrivning: 'Ärendet markerades som löst', aktor },
    },
    'arende',
  )
  if (apiArende) {
    const db = las()
    const index = db.arenden.findIndex((a) => a.id === apiArende.id)
    if (index >= 0) db.arenden[index] = apiArende
    skriv(db)
    return
  }

  await latens()
  const db = las()
  const arende = db.arenden.find((a) => a.id === arendeId)
  if (!arende) return
  arende.status = 'lost'
  arende.uppdaterad = new Date().toISOString()
  loggaAktivitet(db, arendeId, 'status', 'Ärendet markerades som löst', aktor)
  skriv(db)
}

/**
 * Skickar SMS till kunden om att ärendet är klart för upphämtning. Till
 * skillnad från övriga skrivåtgärder ovan finns inget meningsfullt
 * lokalt demolägesfall att falla tillbaka på - att låtsas att ett SMS
 * skickades vore vilseledande, så ett null-svar (API ej nåbart) kastas
 * som ett tydligt fel i stället för att tystnat lyckas.
 */
export async function skickaKlarSms(
  arendeId: string,
  aktor: string,
): Promise<{ skickat: true; till: string }> {
  const resultat = await andraViaOperativApi<{ skickat: true; till: string }>(
    'skicka_sms',
    { arendeId, aktor },
    'sms',
  )
  if (!resultat) throw new Error('SMS-tjänsten kunde inte nås just nu.')
  return resultat
}

/**
 * Skickar nya inloggningsuppgifter till kunden (skapar kontot om det
 * saknas, annars ett helt nytt tillfälligt lösenord - aldrig samma som
 * tidigare). Samma resonemang som skickaKlarSms ovan: inget meningsfullt
 * lokalt demolägesfall, ett null-svar kastas som ett tydligt fel.
 */
export async function skickaNyaInloggningsuppgifter(
  arendeId: string,
  aktor: string,
): Promise<{ kontoSkapat: boolean; kontoAterstallt: boolean }> {
  const resultat = await andraViaOperativApi<{ kontoSkapat: boolean; kontoAterstallt: boolean }>(
    'skicka_inloggningsuppgifter',
    { arendeId, aktor },
    'resultat',
  )
  if (!resultat) throw new Error('Kundportalen kunde inte nås just nu.')
  return resultat
}

export interface KundportalStatus {
  kontoFinns: boolean
  masteBytaLosenord: boolean | null
  senastInloggad: string | null
}

/**
 * Läser kundens kundportalstatus (för statusraden bredvid "Skicka nya
 * inloggningsuppgifter"). Skrivskyddat, en kund i taget - hämtas på
 * begäran när ärendesidan visas, inte i den stora databashämtningen.
 * Returnerar `null` (inte ett kastat fel) om anropet misslyckas - en
 * trasig statuskoll ska aldrig blockera resten av sidan från att visas.
 */
export async function hamtaKundportalStatus(kundId: string): Promise<KundportalStatus | null> {
  if (!isBrowser()) return null

  try {
    const svar = await fetch(`/api/admin/operativt?kundportalStatus=${encodeURIComponent(kundId)}`)
    if (!svar.ok) return null
    const json = (await svar.json()) as { ok?: boolean } & Partial<KundportalStatus>
    if (json.ok !== true) return null
    return {
      kontoFinns: json.kontoFinns === true,
      masteBytaLosenord: json.masteBytaLosenord ?? null,
      senastInloggad: json.senastInloggad ?? null,
    }
  } catch {
    return null
  }
}

/**
 * Nästa lediga ärendenummer, beräknat från aktuell data (inte hårdkodat).
 * Följer samma `NIT-<nummer>`-mönster som seed-datan.
 */
function nastaArendenummer(db: Databas): string {
  const numren = db.arenden
    .map((a) => Number(a.arendenummer.replace(/^NIT-/, '')))
    .filter((n) => Number.isFinite(n))
  const nasta = (numren.length ? Math.max(...numren) : 2400) + 1
  return `NIT-${nasta}`
}

/**
 * Kanaler som personal rimligen kan registrera manuellt. `kontaktformular`
 * och `supportassistent` beskriver ärendets faktiska ursprungskanal och kan
 * därför inte sättas av personal – de förblir förbehållna de automatiska
 * intagsflödena. `as const satisfies` bevarar de exakta literalerna så att
 * kanaltypen nedan (`NyttArende['kanal']`) faktiskt begränsas i TypeScript,
 * inte bara i gränssnittet.
 */
export const manuellaKanaler = ['telefon', 'e-post'] as const satisfies readonly Kanal[]

export interface NyttArende {
  kundId: string
  rubrik: string
  kategori: Kategori
  /** Tom sträng tillåten om kategorin saknar underkategorier. */
  underkategori: string
  prioritet: Prioritet
  kanal: 'telefon' | 'e-post'
  beskrivning: string
}

/**
 * Skapar ett manuellt registrerat ärende, t.ex. efter ett telefonsamtal eller
 * en manuell kundkontakt. Kunduppgifterna (namn, kundtyp, e-post, telefon,
 * organisation) kopieras från den valda, befintliga kunden – exakt som övriga
 * ärenden i demodatan är strukturerade.
 */
export async function skapaArende(uppgifter: NyttArende, aktor: string): Promise<Arende> {
  const apiArende = await skapaViaOperativApi<Arende>(
    'skapa_arende',
    { ...uppgifter, aktor },
    'arende',
  )
  if (apiArende) {
    const db = las()
    if (!db.arenden.some((arende) => arende.id === apiArende.id)) db.arenden.push(apiArende)
    const kund = db.kunder.find((k) => k.id === apiArende.kundId)
    if (kund) kund.senasteKontakt = apiArende.skapad
    skriv(db)
    return apiArende
  }

  await latens(420)
  const db = las()

  const kund = db.kunder.find((k) => k.id === uppgifter.kundId)
  if (!kund) throw new Error('Kunden kunde inte hittas.')

  const nu = new Date().toISOString()
  const nytt: Arende = {
    id: id('a'),
    arendenummer: nastaArendenummer(db),
    rubrik: uppgifter.rubrik.trim(),
    kundId: kund.id,
    kundNamn: kund.namn,
    kundtyp: kund.kundtyp,
    organisation: kund.organisation,
    epost: kund.epost,
    telefon: kund.telefon,
    kategori: uppgifter.kategori,
    underkategori: uppgifter.underkategori.trim(),
    status: 'ny',
    prioritet: uppgifter.prioritet,
    ansvarigId: null,
    kanal: uppgifter.kanal,
    beskrivning: uppgifter.beskrivning.trim(),
    bilagor: [],
    skapad: nu,
    uppdaterad: nu,
  }

  db.arenden.push(nytt)
  kund.senasteKontakt = nu

  loggaAktivitet(
    db,
    nytt.id,
    'skapat',
    `Ärende registrerat manuellt via ${uppgifter.kanal === 'telefon' ? 'telefon' : 'e-post'}`,
    aktor,
  )

  skriv(db)
  return nytt
}

// ─── Skrivning: bokningar ───────────────────────────────────────────────────

export async function skapaBokning(
  bokning: Omit<Bokning, 'id'>,
  aktor: string,
): Promise<Bokning> {
  const apiBokning = await skapaViaOperativApi<Bokning>(
    'skapa_bokning',
    { ...bokning, aktor },
    'bokning',
  )
  if (apiBokning) {
    const db = las()
    if (!db.bokningar.some((b) => b.id === apiBokning.id)) db.bokningar.push(apiBokning)
    if (apiBokning.arendeId) {
      const arende = db.arenden.find((a) => a.id === apiBokning.arendeId)
      if (arende) {
        arende.status = 'bokad'
        arende.uppdaterad = new Date().toISOString()
      }
    }
    skriv(db)
    return apiBokning
  }

  await latens(400)
  const db = las()
  const ny: Bokning = { ...bokning, id: id('bok') }
  db.bokningar.push(ny)

  if (ny.arendeId) {
    const arende = db.arenden.find((a) => a.id === ny.arendeId)
    if (arende) {
      arende.status = 'bokad'
      arende.uppdaterad = new Date().toISOString()
    }
    loggaAktivitet(db, ny.arendeId, 'bokning', `Bokning skapad ${ny.datum} kl. ${ny.tid}`, aktor)
  }

  skriv(db)
  return ny
}

export async function uppdateraBokning(
  bokningId: string,
  andringar: Partial<Pick<Bokning, 'datum' | 'tid' | 'typ' | 'status' | 'notering' | 'tekniker' | 'langdMinuter'>>,
  aktor: string,
) {
  const apiBokning = await andraViaOperativApi<Bokning>(
    'uppdatera_bokning',
    { id: bokningId, andringar, aktor },
    'bokning',
  )
  if (apiBokning) {
    const db = las()
    const index = db.bokningar.findIndex((b) => b.id === apiBokning.id)
    if (index >= 0) db.bokningar[index] = apiBokning
    skriv(db)
    return
  }

  await latens()
  const db = las()
  const bokning = db.bokningar.find((b) => b.id === bokningId)
  if (!bokning) return
  Object.assign(bokning, andringar)
  if (bokning.arendeId) {
    loggaAktivitet(db, bokning.arendeId, 'bokning', 'Bokningen uppdaterades', aktor)
  }
  skriv(db)
}

export async function avbokaBokning(bokningId: string, aktor: string) {
  const apiBokning = await andraViaOperativApi<Bokning>(
    'avboka_bokning',
    { id: bokningId, aktor },
    'bokning',
  )
  if (apiBokning) {
    const db = las()
    const index = db.bokningar.findIndex((b) => b.id === apiBokning.id)
    if (index >= 0) db.bokningar[index] = apiBokning
    if (apiBokning.arendeId) {
      const arende = db.arenden.find((a) => a.id === apiBokning.arendeId)
      if (arende && arende.status === 'bokad') arende.status = 'pagaende'
    }
    skriv(db)
    return
  }

  await latens()
  const db = las()
  const bokning = db.bokningar.find((b) => b.id === bokningId)
  if (!bokning) return
  bokning.status = 'avbokad' satisfies BokningStatus
  if (bokning.arendeId) {
    const arende = db.arenden.find((a) => a.id === bokning.arendeId)
    if (arende && arende.status === 'bokad') arende.status = 'pagaende'
    loggaAktivitet(db, bokning.arendeId, 'bokning', 'Bokningen avbokades', aktor)
  }
  skriv(db)
}

export const bokningTyper: BokningTyp[] = [
  'hembesok',
  'distanssupport',
  'verkstadsbesok',
  'telefonkontakt',
]

// ─── Skrivning: kunder ──────────────────────────────────────────────────────

export async function sparaKundanteckning(kundId: string, anteckning: string) {
  await latens()
  const db = las()
  const kund = db.kunder.find((k) => k.id === kundId)
  if (!kund) return
  kund.interntAnteckning = anteckning.trim() || undefined
  skriv(db)
}

/** Interna anteckningar för en kund, nyast först. */
export function hamtaKundanteckningar(kundId: string): Kundanteckning[] {
  return las()
    .kundanteckningar.filter((a) => a.kundId === kundId)
    .sort((a, b) => +new Date(b.skapad) - +new Date(a.skapad))
}

export async function laggTillKundanteckning(
  kundId: string,
  text: string,
  forfattare: string,
): Promise<void> {
  const apiAnteckning = await skapaViaOperativApi<Kundanteckning>(
    'lagg_till_kundanteckning',
    { kundId, text, forfattare },
    'anteckning',
  )
  if (apiAnteckning) {
    const db = las()
    if (!db.kundanteckningar.some((a) => a.id === apiAnteckning.id)) {
      db.kundanteckningar.push(apiAnteckning)
    }
    skriv(db)
    return
  }

  await latens(320)
  const db = las()
  if (!db.kunder.some((k) => k.id === kundId)) return
  db.kundanteckningar.push({
    id: id('kant'),
    kundId,
    text: text.trim(),
    forfattare,
    skapad: new Date().toISOString(),
  })
  skriv(db)
}

export async function uppdateraKundanteckning(anteckningId: string, text: string) {
  const apiAnteckning = await andraViaOperativApi<Kundanteckning>(
    'uppdatera_kundanteckning',
    { id: anteckningId, text },
    'anteckning',
  )
  if (apiAnteckning) {
    const db = las()
    const index = db.kundanteckningar.findIndex((a) => a.id === apiAnteckning.id)
    if (index >= 0) db.kundanteckningar[index] = apiAnteckning
    skriv(db)
    return
  }

  await latens(300)
  const db = las()
  const anteckning = db.kundanteckningar.find((a) => a.id === anteckningId)
  if (!anteckning) return
  anteckning.text = text.trim()
  anteckning.uppdaterad = new Date().toISOString()
  skriv(db)
}

export async function taBortKundanteckning(anteckningId: string) {
  const apiId = await andraViaOperativApi<string>(
    'ta_bort_kundanteckning',
    { id: anteckningId },
    'id',
  )
  if (apiId) {
    const db = las()
    db.kundanteckningar = db.kundanteckningar.filter((a) => a.id !== anteckningId)
    skriv(db)
    return
  }

  await latens(220)
  const db = las()
  db.kundanteckningar = db.kundanteckningar.filter((a) => a.id !== anteckningId)
  skriv(db)
}

/**
 * Tar bort en kund permanent, inklusive alla dennes ärenden och bokningar
 * (servern gör motsvarande borttagning, se taBortOperativKund i
 * operativa-server.ts). Till skillnad från övriga skrivåtgärder ovan finns
 * inget meningsfullt lokalt demolägesfall att falla tillbaka på - att
 * låtsas att en kund raderades vore vilseledande och oåterkalleligt om det
 * visar sig fel, så ett null-svar (API ej nåbart) kastas som ett tydligt
 * fel i stället för att tyst "lyckas" bara i den lokala cachen.
 *
 * Returnerar `kundportalKontoSparratMisslyckades` så att UI:t kan varna
 * personalen om kunden togs bort lokalt men ändå kan ha kvar sin inloggning
 * i kundportalen (se taBortOperativKund).
 */
export async function taBortKund(kundId: string): Promise<{ kundportalKontoSparratMisslyckades: boolean }> {
  if (!isBrowser()) throw new Error('Kunden kunde inte tas bort just nu.')

  let svar: Response
  try {
    svar = await fetch('/api/admin/operativt', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ typ: 'ta_bort_kund', data: { id: kundId } }),
    })
  } catch {
    throw new Error('Kunden kunde inte tas bort just nu.')
  }

  if (!svar.ok) throw new Error('Kunden kunde inte tas bort just nu.')

  const json = (await svar.json()) as {
    ok?: boolean
    id?: string
    kundportalKontoSparratMisslyckades?: boolean
  }
  if (json.ok !== true || !json.id) throw new Error('Kunden kunde inte tas bort just nu.')

  const db = las()
  db.kunder = db.kunder.filter((k) => k.id !== kundId)
  db.arenden = db.arenden.filter((a) => a.kundId !== kundId)
  db.bokningar = db.bokningar.filter((b) => b.kundId !== kundId)
  db.kundanteckningar = db.kundanteckningar.filter((a) => a.kundId !== kundId)
  skriv(db)

  return { kundportalKontoSparratMisslyckades: json.kundportalKontoSparratMisslyckades === true }
}

/**
 * Tar bort en eller flera ärenden permanent (servern cascadar meddelanden
 * och aktiviteter, se taBortOperativArenden). Samma resonemang som
 * taBortKund ovan - kastar hellre ett tydligt fel än att låtsas lyckas
 * lokalt när servern inte gick att nå.
 */
export async function taBortArenden(arendeIds: string[]) {
  const apiIds = await andraViaOperativApi<string[]>('ta_bort_arenden', { ids: arendeIds }, 'ids')
  if (!apiIds) throw new Error('Ärendena kunde inte tas bort just nu.')

  const idSet = new Set(arendeIds)
  const db = las()
  db.arenden = db.arenden.filter((a) => !idSet.has(a.id))
  db.meddelanden = db.meddelanden.filter((m) => !idSet.has(m.arendeId))
  db.aktiviteter = db.aktiviteter.filter((a) => !idSet.has(a.arendeId))
  skriv(db)
}

/** Fält som får redigeras på en befintlig kund. */
export type Kundandringar = Partial<
  Pick<Kund, 'adress' | 'ort' | 'telefon' | 'epost' | 'kontaktperson' | 'organisation' | 'orgnummer'>
>

export async function uppdateraKund(kundId: string, andringar: Kundandringar) {
  const apiKund = await andraViaOperativApi<Kund>(
    'uppdatera_kund',
    { id: kundId, andringar },
    'kund',
  )
  if (apiKund) {
    const db = las()
    const index = db.kunder.findIndex((k) => k.id === apiKund.id)
    if (index >= 0) db.kunder[index] = apiKund
    for (const arende of db.arenden) {
      if (arende.kundId !== apiKund.id) continue
      arende.epost = apiKund.epost
      arende.telefon = apiKund.telefon
      arende.organisation = apiKund.organisation
    }
    skriv(db)
    return
  }

  await latens(380)
  const db = las()
  const kund = db.kunder.find((k) => k.id === kundId)
  if (!kund) return

  const nyEpost = andringar.epost?.trim()
  const nyTelefon = andringar.telefon?.trim()

  Object.assign(kund, {
    ...andringar,
    epost: nyEpost || kund.epost,
    telefon: nyTelefon || kund.telefon,
    kontaktperson: andringar.kontaktperson?.trim() || undefined,
    organisation: andringar.organisation?.trim() || kund.organisation,
    orgnummer: andringar.orgnummer?.trim() || kund.orgnummer,
  })

  // Håll ärendena i synk – de bär kundens kontaktuppgifter för snabb sökning.
  for (const arende of db.arenden) {
    if (arende.kundId !== kundId) continue
    arende.epost = kund.epost
    arende.telefon = kund.telefon
    arende.organisation = kund.organisation
  }

  skriv(db)
}

export interface NyKund {
  namn: string
  kundtyp: Kundtyp
  epost: string
  telefon: string
  adress: string
  ort: string
  organisation?: string
  orgnummer?: string
  kontaktperson?: string
  forstaAnteckning?: string
}

/**
 * Skapar en ny demokund. Kunden hamnar direkt i samma tabell som resten av
 * portalen läser, så den syns i kundlistan, bokningsdialogen och sökningar.
 */
export async function skapaKund(uppgifter: NyKund, forfattare: string): Promise<Kund> {
  const apiKund = await skapaViaOperativApi<Kund>(
    'skapa_kund',
    { ...uppgifter, forfattare },
    'kund',
  )
  if (apiKund) {
    const db = las()
    if (!db.kunder.some((kund) => kund.id === apiKund.id)) db.kunder.push(apiKund)
    const forsta = uppgifter.forstaAnteckning?.trim()
    if (forsta) {
      db.kundanteckningar.push({
        id: id('kant'),
        kundId: apiKund.id,
        text: forsta,
        forfattare,
        skapad: apiKund.skapad,
      })
    }
    skriv(db)
    return apiKund
  }

  await latens(480)
  const db = las()
  const nu = new Date().toISOString()

  const kund: Kund = {
    id: id('k'),
    namn: uppgifter.namn.trim(),
    kundtyp: uppgifter.kundtyp,
    organisation: uppgifter.organisation?.trim() || undefined,
    orgnummer: uppgifter.orgnummer?.trim() || undefined,
    epost: uppgifter.epost.trim(),
    telefon: uppgifter.telefon.trim(),
    adress: uppgifter.adress.trim(),
    ort: uppgifter.ort.trim(),
    kontaktperson: uppgifter.kontaktperson?.trim() || undefined,
    senasteKontakt: nu,
    skapad: nu,
  }

  db.kunder.push(kund)

  const forsta = uppgifter.forstaAnteckning?.trim()
  if (forsta) {
    db.kundanteckningar.push({
      id: id('kant'),
      kundId: kund.id,
      text: forsta,
      forfattare,
      skapad: nu,
    })
  }

  skriv(db)
  return kund
}

// ─── Skrivning: inställningar ───────────────────────────────────────────────

export async function vaxlaAvisering(aviseringId: string) {
  await latens(180)
  const db = las()
  const a = db.aviseringar.find((x) => x.id === aviseringId)
  if (!a) return
  a.aktiv = !a.aktiv
  skriv(db)
}

export async function vaxlaMottagare(mottagareId: string) {
  await latens(180)
  const db = las()
  const m = db.mottagare.find((x) => x.id === mottagareId)
  if (!m) return
  m.aktiv = !m.aktiv
  skriv(db)
}

export async function vaxlaKategori(kategoriId: string) {
  await latens(180)
  const db = las()
  const k = db.kategorier.find((x) => x.id === kategoriId)
  if (!k) return
  k.aktiv = !k.aktiv
  skriv(db)
}

export async function sparaStandardsvar(svarId: string, rubrik: string, text: string) {
  await latens(300)
  const db = las()
  const s = db.standardsvar.find((x) => x.id === svarId)
  if (!s) return
  s.rubrik = rubrik
  s.text = text
  skriv(db)
}

export async function laggTillMottagare(epost: string, syfte: string) {
  await latens(300)
  const db = las()
  db.mottagare.push({ id: id('mot'), epost, syfte, aktiv: true })
  skriv(db)
}

export async function taBortMottagare(mottagareId: string) {
  await latens(200)
  const db = las()
  db.mottagare = db.mottagare.filter((m) => m.id !== mottagareId)
  skriv(db)
}
