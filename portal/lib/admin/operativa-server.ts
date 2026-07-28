import { skapaSupabaseServiceklient } from '@/lib/supabase/service'
import type { Arende, Bokning, Kund } from '@/lib/types'

export interface OperativAdminData {
  kunder: Kund[]
  arenden: Arende[]
  bokningar: Bokning[]
}

export async function hamtaOperativAdminData(): Promise<OperativAdminData> {
  const supabase = skapaSupabaseServiceklient()

  const [kunderSvar, arendenSvar, bokningarSvar] = await Promise.all([
    supabase.from('admin_kunder').select('*').order('senaste_kontakt', { ascending: false }),
    supabase.from('admin_arenden').select('*').order('uppdaterad', { ascending: false }),
    supabase.from('admin_bokningar').select('*').order('datum', { ascending: true }),
  ])

  if (kunderSvar.error || arendenSvar.error || bokningarSvar.error) {
    throw new Error('Kunde inte läsa operativ admin-data från Supabase.')
  }

  return {
    kunder: (kunderSvar.data ?? []).flatMap((rad) => {
      const kund = normaliseraKundRad(rad)
      return kund ? [kund] : []
    }),
    arenden: (arendenSvar.data ?? []).flatMap((rad) => {
      const arende = normaliseraArendeRad(rad)
      return arende ? [arende] : []
    }),
    bokningar: (bokningarSvar.data ?? []).flatMap((rad) => {
      const bokning = normaliseraBokningRad(rad)
      return bokning ? [bokning] : []
    }),
  }
}

function normaliseraKundRad(data: unknown): Kund | null {
  if (!arObjekt(data)) return null
  const id = text(data.id)
  const namn = text(data.namn)
  const kundtyp = data.kundtyp === 'privatperson' || data.kundtyp === 'verksamhet' ? data.kundtyp : null
  const epost = text(data.epost)
  const telefon = text(data.telefon)
  const adress = text(data.adress)
  const ort = text(data.ort)
  const senasteKontakt = text(data.senaste_kontakt)
  const skapad = text(data.skapad)

  if (!id || !namn || !kundtyp || !epost || !telefon || !senasteKontakt || !skapad) return null

  return {
    id,
    namn,
    kundtyp,
    organisation: optionalText(data.organisation),
    orgnummer: optionalText(data.orgnummer),
    epost,
    telefon,
    adress,
    ort,
    kontaktperson: optionalText(data.kontaktperson),
    senasteKontakt,
    skapad,
  }
}

function normaliseraArendeRad(data: unknown): Arende | null {
  if (!arObjekt(data)) return null
  const id = text(data.id)
  const arendenummer = text(data.arendenummer)
  const rubrik = text(data.rubrik)
  const kundId = text(data.kund_id)
  const kundNamn = text(data.kund_namn)
  const epost = text(data.epost)
  const telefon = text(data.telefon)
  const underkategori = text(data.underkategori)
  const beskrivning = text(data.beskrivning)
  const skapad = text(data.skapad)
  const uppdaterad = text(data.uppdaterad)

  if (
    !id ||
    !arendenummer ||
    !rubrik ||
    !kundId ||
    !kundNamn ||
    !arKundtyp(data.kundtyp) ||
    !arKategori(data.kategori) ||
    !arArendeStatus(data.status) ||
    !arPrioritet(data.prioritet) ||
    !arKanal(data.kanal) ||
    !epost ||
    !telefon ||
    !beskrivning ||
    !skapad ||
    !uppdaterad
  ) {
    return null
  }

  return {
    id,
    arendenummer,
    rubrik,
    kundId,
    kundNamn,
    kundtyp: data.kundtyp,
    organisation: optionalText(data.organisation),
    epost,
    telefon,
    kategori: data.kategori,
    underkategori,
    status: data.status,
    prioritet: data.prioritet,
    ansvarigId: nullableText(data.ansvarig_id),
    kanal: data.kanal,
    beskrivning,
    assistentSammanfattning: optionalText(data.assistent_sammanfattning),
    bilagor: Array.isArray(data.bilagor) ? data.bilagor : [],
    skapad,
    uppdaterad,
    sistaSvar: optionalText(data.sista_svar),
  }
}

function normaliseraBokningRad(data: unknown): Bokning | null {
  if (!arObjekt(data)) return null
  const id = text(data.id)
  const kundId = text(data.kund_id)
  const kundNamn = text(data.kund_namn)
  const datum = text(data.datum)
  const tid = text(data.tid).slice(0, 5)
  const langdMinuter = typeof data.langd_minuter === 'number' ? data.langd_minuter : null
  const tekniker = text(data.tekniker)
  const plats = text(data.plats)

  if (
    !id ||
    !kundId ||
    !kundNamn ||
    !arBokningTyp(data.typ) ||
    !arBokningStatus(data.status) ||
    !datum ||
    !tid ||
    !langdMinuter ||
    !tekniker
  ) {
    return null
  }

  return {
    id,
    arendeId: optionalText(data.arende_id),
    arendenummer: optionalText(data.arendenummer),
    kundId,
    kundNamn,
    typ: data.typ,
    status: data.status,
    datum,
    tid,
    langdMinuter,
    tekniker,
    plats,
    notering: optionalText(data.notering),
  }
}

function arObjekt(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null
}

function text(varde: unknown) {
  return typeof varde === 'string' ? varde.trim() : ''
}

function optionalText(varde: unknown) {
  const normaliserat = text(varde)
  return normaliserat || undefined
}

function nullableText(varde: unknown) {
  const normaliserat = text(varde)
  return normaliserat || null
}

function arKundtyp(varde: unknown): varde is Kund['kundtyp'] {
  return varde === 'privatperson' || varde === 'verksamhet'
}

function arKategori(varde: unknown): varde is Arende['kategori'] {
  return [
    'datorer_vardags_it',
    'natverk_wifi',
    'konton_moln_sakerhet',
    'installation',
    'sakerhet_virus',
  ].includes(String(varde))
}

function arArendeStatus(varde: unknown): varde is Arende['status'] {
  return ['ny', 'pagaende', 'vantar_pa_kund', 'bokad', 'lost', 'stangd'].includes(String(varde))
}

function arPrioritet(varde: unknown): varde is Arende['prioritet'] {
  return ['lag', 'normal', 'hog', 'kritisk'].includes(String(varde))
}

function arKanal(varde: unknown): varde is Arende['kanal'] {
  return ['kontaktformular', 'supportassistent', 'telefon', 'e-post'].includes(String(varde))
}

function arBokningTyp(varde: unknown): varde is Bokning['typ'] {
  return ['hembesok', 'distanssupport', 'verkstadsbesok', 'telefonkontakt'].includes(String(varde))
}

function arBokningStatus(varde: unknown): varde is Bokning['status'] {
  return ['planerad', 'bekraftad', 'genomford', 'avbokad'].includes(String(varde))
}
