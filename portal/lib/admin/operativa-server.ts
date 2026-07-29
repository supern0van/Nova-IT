import { arAdministrator, arSystemRoll } from '@/lib/auth/roll'
import { initialerFranNamn } from '@/lib/personal'
import { skapaSupabaseServiceklient } from '@/lib/supabase/service'
import type {
  Aktivitet,
  Anvandare,
  Arende,
  Bokning,
  Kategori,
  Kund,
  Kundanteckning,
  Kundtyp,
  Meddelande,
  Prioritet,
} from '@/lib/types'

export interface OperativAdminData {
  kunder: Kund[]
  arenden: Arende[]
  bokningar: Bokning[]
  meddelanden: Meddelande[]
  aktiviteter: Aktivitet[]
  kundanteckningar: Kundanteckning[]
  personal: Anvandare[]
}

export class OperativtAdminFel extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message)
  }
}

// Max antal försök vid unik-constraint-krock (23505) på arendenummer, se
// skapaOperativtArende(). Räknas som app-side mildring, inte en garanti –
// se rapporten om DB-sekvens/RPC för en robust lösning.
const ARENDENUMMER_MAX_FORSOK = 3

export interface NyOperativKund {
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
  forfattare: string
}

export interface NyttOperativtArende {
  kundId: string
  rubrik: string
  kategori: Kategori
  underkategori: string
  prioritet: Prioritet
  kanal: 'telefon' | 'e-post'
  beskrivning: string
  aktor: string
}

export interface NyOperativBokning {
  arendeId?: string
  arendenummer?: string
  kundId: string
  kundNamn: string
  typ: Bokning['typ']
  status: Bokning['status']
  datum: string
  tid: string
  langdMinuter: number
  tekniker: string
  plats: string
  notering?: string
  aktor: string
}

export type OperativaKundandringar = Partial<
  Pick<Kund, 'adress' | 'ort' | 'telefon' | 'epost' | 'kontaktperson' | 'organisation' | 'orgnummer'>
>

export type OperativaBokningsandringar = Partial<
  Pick<Bokning, 'datum' | 'tid' | 'typ' | 'status' | 'notering' | 'tekniker' | 'langdMinuter'>
>

export type OperativaArendeandringar = Partial<
  Pick<Arende, 'status' | 'prioritet' | 'ansvarigId'>
>

export async function hamtaOperativAdminData(options: { endastPublikaKontaktintag?: boolean } = {}): Promise<OperativAdminData> {
  const supabase = skapaSupabaseServiceklient()

  const [
    kunderSvar,
    arendenSvar,
    bokningarSvar,
    meddelandenSvar,
    aktiviteterSvar,
    kundanteckningarSvar,
    personalSvar,
  ] = await Promise.all([
    supabase.from('admin_kunder').select('*').order('senaste_kontakt', { ascending: false }),
    supabase.from('admin_arenden').select('*').order('uppdaterad', { ascending: false }),
    supabase.from('admin_bokningar').select('*').order('datum', { ascending: true }),
    supabase.from('admin_meddelanden').select('*').order('tidpunkt', { ascending: true }),
    supabase.from('admin_aktiviteter').select('*').order('tidpunkt', { ascending: false }),
    supabase.from('admin_kundanteckningar').select('*').order('skapad', { ascending: false }),
    supabase.from('profiles').select('id, namn, epost, roll, titel, aktiv').order('namn', { ascending: true }),
  ])

  if (
    kunderSvar.error ||
    arendenSvar.error ||
    bokningarSvar.error ||
    meddelandenSvar.error ||
    aktiviteterSvar.error ||
    kundanteckningarSvar.error ||
    personalSvar.error
  ) {
    throw new Error('Kunde inte läsa operativ admin-data från Supabase.')
  }

  const kunder = (kunderSvar.data ?? []).flatMap((rad) => {
      const kund = normaliseraKundRad(rad)
      return kund ? [kund] : []
    })
  const arenden = (arendenSvar.data ?? []).flatMap((rad) => {
      const arende = normaliseraArendeRad(rad)
      return arende ? [arende] : []
    })
  const bokningar = (bokningarSvar.data ?? []).flatMap((rad) => {
      const bokning = normaliseraBokningRad(rad)
      return bokning ? [bokning] : []
    })
  const meddelanden = (meddelandenSvar.data ?? []).flatMap((rad) => {
      const meddelande = normaliseraMeddelandeRad(rad)
      return meddelande ? [meddelande] : []
    })
  const aktiviteter = (aktiviteterSvar.data ?? []).flatMap((rad) => {
      const aktivitet = normaliseraAktivitetRad(rad)
      return aktivitet ? [aktivitet] : []
    })
  const kundanteckningar = (kundanteckningarSvar.data ?? []).flatMap((rad) => {
      const anteckning = normaliseraKundanteckningRad(rad)
      return anteckning ? [anteckning] : []
    })
  const personal = (personalSvar.data ?? []).flatMap((rad) => {
      const person = normaliseraPersonalRad(rad)
      return person ? [person] : []
    })

  if (options.endastPublikaKontaktintag) {
    const publikaKontaktintag = arenden.filter(
      (arende) =>
        arende.kanal === 'kontaktformular' &&
        arende.status === 'ny' &&
        !arende.rubrik.startsWith('[DEMO]'),
    )
    const publikaArendeId = new Set(publikaKontaktintag.map((arende) => arende.id))
    const publikaKundId = new Set(publikaKontaktintag.map((arende) => arende.kundId))
    const publikaAnsvarigId = new Set(
      publikaKontaktintag.flatMap((arende) => (arende.ansvarigId ? [arende.ansvarigId] : [])),
    )
    return {
      kunder: kunder.filter((kund) => publikaKundId.has(kund.id)),
      arenden: publikaKontaktintag,
      bokningar: bokningar.filter((bokning) => publikaArendeId.has(bokning.arendeId ?? '')),
      meddelanden: meddelanden.filter((meddelande) => publikaArendeId.has(meddelande.arendeId)),
      aktiviteter: aktiviteter.filter((aktivitet) => publikaArendeId.has(aktivitet.arendeId)),
      kundanteckningar: kundanteckningar.filter((anteckning) => publikaKundId.has(anteckning.kundId)),
      personal: personal.filter((person) => publikaAnsvarigId.has(person.id)),
    }
  }

  return { kunder, arenden, bokningar, meddelanden, aktiviteter, kundanteckningar, personal }
}

export async function skapaOperativKund(uppgifter: NyOperativKund): Promise<Kund> {
  const namn = text(uppgifter.namn)
  const epost = text(uppgifter.epost)
  const telefon = text(uppgifter.telefon)
  if (!arGiltigtKundnamn(namn)) {
    throw new OperativtAdminFel('Namnet måste vara mellan 2 och 160 tecken.')
  }
  if (!arKundtyp(uppgifter.kundtyp)) {
    throw new OperativtAdminFel('Välj en giltig kundtyp.')
  }
  if (!arGiltigEpost(epost)) {
    throw new OperativtAdminFel('Ange en giltig e-postadress.')
  }
  if (!arGiltigTelefon(telefon)) {
    throw new OperativtAdminFel('Ange ett giltigt telefonnummer.')
  }
  if (uppgifter.kundtyp === 'verksamhet' && !text(uppgifter.organisation)) {
    throw new OperativtAdminFel('Ange verksamhetens namn.')
  }

  const supabase = skapaSupabaseServiceklient()
  const { data, error } = await supabase
    .from('admin_kunder')
    .insert({
      namn,
      kundtyp: uppgifter.kundtyp,
      organisation: optionalText(uppgifter.organisation),
      orgnummer: optionalText(uppgifter.orgnummer),
      epost,
      telefon,
      adress: text(uppgifter.adress),
      ort: text(uppgifter.ort),
      kontaktperson: optionalText(uppgifter.kontaktperson),
    })
    .select('*')
    .single()

  if (error) throw new Error('Kunde inte skapa kund.')
  const kund = normaliseraKundRad(data)
  if (!kund) throw new Error('Kunden skapades men kunde inte läsas.')

  const anteckning = text(uppgifter.forstaAnteckning)
  if (anteckning) {
    await supabase.from('admin_kundanteckningar').insert({
      kund_id: kund.id,
      text: anteckning,
      forfattare: text(uppgifter.forfattare) || 'Okänd',
    })
  }

  return kund
}

export async function skapaOperativtArende(uppgifter: NyttOperativtArende): Promise<Arende> {
  const rubrik = text(uppgifter.rubrik)
  const beskrivning = text(uppgifter.beskrivning)
  if (
    !text(uppgifter.kundId) ||
    !arGiltigRubrik(rubrik) ||
    !arKategori(uppgifter.kategori) ||
    !arPrioritet(uppgifter.prioritet) ||
    !['telefon', 'e-post'].includes(uppgifter.kanal) ||
    !arGiltigBeskrivning(beskrivning)
  ) {
    throw new OperativtAdminFel('Kontrollera ärendets obligatoriska fält.')
  }

  const supabase = skapaSupabaseServiceklient()
  const { data: kundRad, error: kundFel } = await supabase
    .from('admin_kunder')
    .select('*')
    .eq('id', uppgifter.kundId)
    .single()
  if (kundFel) {
    if (arPostgresFelkod(kundFel, 'PGRST116')) throw new OperativtAdminFel('Kunden kunde inte hittas.', 404)
    throw new Error('Kunden kunde inte hittas.')
  }

  const kund = normaliseraKundRad(kundRad)
  if (!kund) throw new Error('Kunden kunde inte läsas.')

  // `arendenummer` beräknas app-side (högsta befintliga + 1), inte via en
  // DB-sekvens. Vid parallella skapanden kan två anrop räkna ut samma nästa
  // nummer och kollidera mot den unika constrainten (23505). Vi försöker
  // därför om upp till ARENDENUMMER_MAX_FORSOK gånger och räknar ut ett nytt
  // arendenummer varje gång – den rad som orsakade konflikten är då synlig i
  // nästa SELECT, så nästa försök får ett genuint ledigt nummer. Detta är en
  // säker mildring utan schemaändring, inte en fullständig lösning – se
  // rekommendationen om DB-sekvens/RPC i rapporten.
  for (let forsok = 0; forsok < ARENDENUMMER_MAX_FORSOK; forsok++) {
    const arendenummer = await nastaArendenummer()
    const { data, error } = await supabase
      .from('admin_arenden')
      .insert({
        arendenummer,
        rubrik,
        kund_id: kund.id,
        kund_namn: kund.namn,
        kundtyp: kund.kundtyp,
        organisation: kund.organisation,
        epost: kund.epost,
        telefon: kund.telefon,
        kategori: uppgifter.kategori,
        underkategori: text(uppgifter.underkategori),
        prioritet: uppgifter.prioritet,
        kanal: uppgifter.kanal,
        beskrivning,
      })
      .select('*')
      .single()

    if (error) {
      if (arPostgresFelkod(error, '23505')) {
        if (forsok < ARENDENUMMER_MAX_FORSOK - 1) continue
        throw new OperativtAdminFel('Kunde inte skapa ärendet just nu — försök igen.', 409)
      }
      throw new Error('Kunde inte skapa ärende.')
    }

    const arende = normaliseraArendeRad(data)
    if (!arende) throw new Error('Ärendet skapades men kunde inte läsas.')

    await Promise.all([
      supabase.from('admin_kunder').update({ senaste_kontakt: new Date().toISOString() }).eq('id', kund.id),
      supabase.from('admin_aktiviteter').insert({
        arende_id: arende.id,
        typ: 'skapat',
        beskrivning: `Ärende registrerat manuellt via ${uppgifter.kanal === 'telefon' ? 'telefon' : 'e-post'}`,
        aktor: text(uppgifter.aktor) || 'Okänd',
      }),
    ])

    return arende
  }

  // Ouppnåeligt i praktiken (loopen returnerar eller kastar alltid inom sig
  // själv), men krävs för TypeScripts kontrollflödesanalys.
  throw new OperativtAdminFel('Kunde inte skapa ärendet just nu — försök igen.', 409)
}

export async function skapaOperativBokning(uppgifter: NyOperativBokning): Promise<Bokning> {
  if (
    !text(uppgifter.kundId) ||
    !arBokningTyp(uppgifter.typ) ||
    !arBokningStatus(uppgifter.status) ||
    !text(uppgifter.datum) ||
    !text(uppgifter.tid) ||
    !Number.isInteger(uppgifter.langdMinuter) ||
    uppgifter.langdMinuter < 15 ||
    uppgifter.langdMinuter > 480 ||
    !text(uppgifter.tekniker) ||
    !text(uppgifter.plats)
  ) {
    throw new OperativtAdminFel('Kontrollera bokningens obligatoriska fält.')
  }

  const supabase = skapaSupabaseServiceklient()
  const { data, error } = await supabase
    .from('admin_bokningar')
    .insert({
      arende_id: optionalText(uppgifter.arendeId),
      arendenummer: optionalText(uppgifter.arendenummer),
      kund_id: uppgifter.kundId,
      kund_namn: text(uppgifter.kundNamn) || 'Okänd kund',
      typ: uppgifter.typ,
      status: uppgifter.status,
      datum: uppgifter.datum,
      tid: uppgifter.tid,
      langd_minuter: uppgifter.langdMinuter,
      tekniker: uppgifter.tekniker,
      plats: uppgifter.plats,
      notering: optionalText(uppgifter.notering),
    })
    .select('*')
    .single()

  if (error) throw new Error('Kunde inte skapa bokning.')
  const bokning = normaliseraBokningRad(data)
  if (!bokning) throw new Error('Bokningen skapades men kunde inte läsas.')

  if (bokning.arendeId) {
    await Promise.all([
      supabase.from('admin_arenden').update({ status: 'bokad' }).eq('id', bokning.arendeId),
      supabase.from('admin_aktiviteter').insert({
        arende_id: bokning.arendeId,
        typ: 'bokning',
        beskrivning: `Bokning skapad ${bokning.datum} kl. ${bokning.tid}`,
        aktor: text(uppgifter.aktor) || 'Okänd',
      }),
    ])
  }

  return bokning
}

export async function uppdateraOperativKund(
  kundId: string,
  andringar: OperativaKundandringar,
): Promise<Kund> {
  if (!text(kundId)) throw new Error('Ogiltigt kund-id.')

  const tillatnaAndringar: Record<string, string | null> = {}
  if ('adress' in andringar) tillatnaAndringar.adress = text(andringar.adress)
  if ('ort' in andringar) tillatnaAndringar.ort = text(andringar.ort)
  if ('telefon' in andringar) {
    const telefon = text(andringar.telefon)
    if (!arGiltigTelefon(telefon)) throw new OperativtAdminFel('Ange ett giltigt telefonnummer.')
    tillatnaAndringar.telefon = telefon
  }
  if ('epost' in andringar) {
    const epost = text(andringar.epost)
    if (!arGiltigEpost(epost)) throw new OperativtAdminFel('Ange en giltig e-postadress.')
    tillatnaAndringar.epost = epost
  }
  if ('kontaktperson' in andringar) tillatnaAndringar.kontaktperson = optionalText(andringar.kontaktperson) ?? null
  if ('organisation' in andringar) {
    const organisation = optionalText(andringar.organisation)
    if (organisation !== undefined && organisation.length > 160) {
      throw new OperativtAdminFel('Organisationsnamnet är för långt.')
    }
    tillatnaAndringar.organisation = organisation ?? null
  }
  if ('orgnummer' in andringar) tillatnaAndringar.orgnummer = optionalText(andringar.orgnummer) ?? null

  const supabase = skapaSupabaseServiceklient()
  const { data, error } = await supabase
    .from('admin_kunder')
    .update(tillatnaAndringar)
    .eq('id', kundId)
    .select('*')
    .single()

  if (error) {
    if (arPostgresFelkod(error, 'PGRST116')) throw new OperativtAdminFel('Kunden kunde inte hittas.', 404)
    throw new Error('Kunde inte uppdatera kund.')
  }
  const kund = normaliseraKundRad(data)
  if (!kund) throw new Error('Kunden uppdaterades men kunde inte läsas.')

  await supabase
    .from('admin_arenden')
    .update({
      epost: kund.epost,
      telefon: kund.telefon,
      organisation: kund.organisation,
    })
    .eq('kund_id', kund.id)

  return kund
}

export async function uppdateraOperativBokning(
  bokningId: string,
  andringar: OperativaBokningsandringar,
  aktor: string,
): Promise<Bokning> {
  if (!text(bokningId)) throw new Error('Ogiltigt boknings-id.')

  const uppdatering = normaliseraBokningsandringar(andringar)
  const supabase = skapaSupabaseServiceklient()
  const { data, error } = await supabase
    .from('admin_bokningar')
    .update(uppdatering)
    .eq('id', bokningId)
    .select('*')
    .single()

  if (error) {
    if (arPostgresFelkod(error, 'PGRST116')) throw new OperativtAdminFel('Bokningen kunde inte hittas.', 404)
    throw new Error('Kunde inte uppdatera bokning.')
  }
  const bokning = normaliseraBokningRad(data)
  if (!bokning) throw new Error('Bokningen uppdaterades men kunde inte läsas.')

  if (bokning.arendeId) {
    await supabase.from('admin_aktiviteter').insert({
      arende_id: bokning.arendeId,
      typ: 'bokning',
      beskrivning: 'Bokningen uppdaterades',
      aktor: text(aktor) || 'Okänd',
    })
  }

  return bokning
}

export async function avbokaOperativBokning(bokningId: string, aktor: string): Promise<Bokning> {
  const bokning = await uppdateraOperativBokning(bokningId, { status: 'avbokad' }, aktor)
  if (!bokning.arendeId) return bokning

  const supabase = skapaSupabaseServiceklient()
  await Promise.all([
    supabase.from('admin_arenden').update({ status: 'pagaende' }).eq('id', bokning.arendeId).eq('status', 'bokad'),
    supabase.from('admin_aktiviteter').insert({
      arende_id: bokning.arendeId,
      typ: 'bokning',
      beskrivning: 'Bokningen avbokades',
      aktor: text(aktor) || 'Okänd',
    }),
  ])

  return bokning
}

export async function uppdateraOperativtArende(
  arendeId: string,
  andringar: OperativaArendeandringar,
  aktivitet: { typ: 'status' | 'prioritet' | 'tilldelning'; beskrivning: string; aktor: string },
): Promise<Arende> {
  if (!text(arendeId)) throw new Error('Ogiltigt ärende-id.')

  const uppdatering: Record<string, string | null> = {}
  if ('status' in andringar) {
    if (!arArendeStatus(andringar.status)) throw new OperativtAdminFel('Ogiltig status.')
    uppdatering.status = andringar.status
  }
  if ('prioritet' in andringar) {
    if (!arPrioritet(andringar.prioritet)) throw new OperativtAdminFel('Ogiltig prioritet.')
    uppdatering.prioritet = andringar.prioritet
  }
  if ('ansvarigId' in andringar) {
    uppdatering.ansvarig_id = nullableText(andringar.ansvarigId)
  }

  const supabase = skapaSupabaseServiceklient()
  const { data, error } = await supabase
    .from('admin_arenden')
    .update(uppdatering)
    .eq('id', arendeId)
    .select('*')
    .single()

  if (error) {
    if (arPostgresFelkod(error, 'PGRST116')) throw new OperativtAdminFel('Ärendet kunde inte hittas.', 404)
    throw new Error('Kunde inte uppdatera ärende.')
  }
  const arende = normaliseraArendeRad(data)
  if (!arende) throw new Error('Ärendet uppdaterades men kunde inte läsas.')

  await supabase.from('admin_aktiviteter').insert({
    arende_id: arende.id,
    typ: aktivitet.typ,
    beskrivning: aktivitet.beskrivning,
    aktor: text(aktivitet.aktor) || 'Okänd',
  })

  return arende
}

export async function laggTillOperativtMeddelande({
  arendeId,
  text: meddelandeText,
  internt,
  avsandareNamn,
}: {
  arendeId: string
  text: string
  internt: boolean
  avsandareNamn: string
}): Promise<Meddelande> {
  if (!text(arendeId) || !text(meddelandeText) || typeof internt !== 'boolean') {
    throw new Error('Ogiltigt meddelande.')
  }

  const supabase = skapaSupabaseServiceklient()
  const nu = new Date().toISOString()
  const { data, error } = await supabase
    .from('admin_meddelanden')
    .insert({
      arende_id: arendeId,
      avsandare: 'personal',
      avsandare_namn: text(avsandareNamn) || 'Okänd',
      text: meddelandeText.trim(),
      internt,
      tidpunkt: nu,
    })
    .select('*')
    .single()

  if (error) throw new Error('Kunde inte spara meddelande.')
  const meddelande = normaliseraMeddelandeRad(data)
  if (!meddelande) throw new Error('Meddelandet sparades men kunde inte läsas.')

  const arendeUppdatering: Record<string, string> = { uppdaterad: nu }
  if (!internt) {
    arendeUppdatering.sista_svar = nu
  }

  await Promise.all([
    supabase.from('admin_arenden').update(arendeUppdatering).eq('id', arendeId),
    supabase.from('admin_aktiviteter').insert({
      arende_id: arendeId,
      typ: internt ? 'anteckning' : 'meddelande',
      beskrivning: internt ? 'Intern anteckning tillagd' : 'Svar skickat till kund',
      aktor: text(avsandareNamn) || 'Okänd',
    }),
  ])

  return meddelande
}

export async function laggTillOperativKundanteckning({
  kundId,
  text: anteckningText,
  forfattare,
}: {
  kundId: string
  text: string
  forfattare: string
}): Promise<Kundanteckning> {
  if (!text(kundId) || !text(anteckningText)) throw new Error('Ogiltig kundanteckning.')

  const supabase = skapaSupabaseServiceklient()
  const { data, error } = await supabase
    .from('admin_kundanteckningar')
    .insert({
      kund_id: kundId,
      text: anteckningText.trim(),
      forfattare: text(forfattare) || 'Okänd',
    })
    .select('*')
    .single()

  if (error) throw new Error('Kunde inte spara kundanteckning.')
  const anteckning = normaliseraKundanteckningRad(data)
  if (!anteckning) throw new Error('Kundanteckningen sparades men kunde inte läsas.')
  return anteckning
}

export async function uppdateraOperativKundanteckning(
  anteckningId: string,
  anteckningText: string,
): Promise<Kundanteckning> {
  if (!text(anteckningId) || !text(anteckningText)) throw new Error('Ogiltig kundanteckning.')

  const supabase = skapaSupabaseServiceklient()
  const { data, error } = await supabase
    .from('admin_kundanteckningar')
    .update({ text: anteckningText.trim(), uppdaterad: new Date().toISOString() })
    .eq('id', anteckningId)
    .select('*')
    .single()

  if (error) {
    if (arPostgresFelkod(error, 'PGRST116')) throw new OperativtAdminFel('Anteckningen kunde inte hittas.', 404)
    throw new Error('Kunde inte uppdatera kundanteckning.')
  }
  const anteckning = normaliseraKundanteckningRad(data)
  if (!anteckning) throw new Error('Kundanteckningen uppdaterades men kunde inte läsas.')
  return anteckning
}

export async function taBortOperativKundanteckning(anteckningId: string): Promise<string> {
  if (!text(anteckningId)) throw new Error('Ogiltigt kundantecknings-id.')

  const supabase = skapaSupabaseServiceklient()
  const { error } = await supabase.from('admin_kundanteckningar').delete().eq('id', anteckningId)
  if (error) throw new Error('Kunde inte ta bort kundanteckning.')
  return anteckningId
}

/**
 * Ärendenummer genereras atomärt av en Postgres-sekvens via RPC
 * (`nasta_admin_arendenummer`, se migrationen
 * 20260728165341_admin_arendenummer_sekvens.sql), inte längre app-side
 * "SELECT MAX + 1". Sekvensen garanterar unikhet oavsett samtidighet, så
 * retry-loopen i skapaOperativtArende() ovan är nu bara ett skyddsnät för
 * oväntade fel, inte den primära krockskyddet.
 */
async function nastaArendenummer(): Promise<string> {
  const supabase = skapaSupabaseServiceklient()
  const { data, error } = await supabase.rpc('nasta_admin_arendenummer')

  if (error || typeof data !== 'string' || !data) {
    throw new Error('Kunde inte beräkna ärendenummer.')
  }

  return data
}

function normaliseraBokningsandringar(andringar: OperativaBokningsandringar) {
  const uppdatering: Record<string, string | number | null> = {}
  if ('datum' in andringar) uppdatering.datum = text(andringar.datum)
  if ('tid' in andringar) uppdatering.tid = text(andringar.tid)
  if ('typ' in andringar) {
    if (!arBokningTyp(andringar.typ)) throw new OperativtAdminFel('Ogiltig bokningstyp.')
    uppdatering.typ = andringar.typ
  }
  if ('status' in andringar) {
    if (!arBokningStatus(andringar.status)) throw new OperativtAdminFel('Ogiltig bokningsstatus.')
    uppdatering.status = andringar.status
  }
  if ('notering' in andringar) uppdatering.notering = optionalText(andringar.notering) ?? null
  if ('tekniker' in andringar) {
    const tekniker = text(andringar.tekniker)
    if (!tekniker) throw new OperativtAdminFel('Ogiltig tekniker.')
    uppdatering.tekniker = tekniker
  }
  if ('langdMinuter' in andringar) {
    const langdMinuter = andringar.langdMinuter
    if (
      !Number.isInteger(langdMinuter) ||
      langdMinuter === undefined ||
      langdMinuter < 15 ||
      langdMinuter > 480
    ) {
      throw new OperativtAdminFel('Ogiltig bokningslängd.')
    }
    uppdatering.langd_minuter = langdMinuter
  }

  return uppdatering
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

/**
 * Bygger tilldelningsbar personal från `public.profiles`. `SystemRoll`
 * (administrator/medarbetare) är adminpanelens åtkomstroll, inte den
 * operativa personal-/teknikerrollen (`Roll` här) – samma mappning som
 * `verifieraOperativAtkomst()` i route.ts använder för behörighetskontroll.
 */
function normaliseraPersonalRad(data: unknown): Anvandare | null {
  if (!arObjekt(data)) return null
  const id = text(data.id)
  const namn = text(data.namn)
  const epost = text(data.epost)
  const systemRoll = data.roll
  const aktiv = typeof data.aktiv === 'boolean' ? data.aktiv : null

  if (!id || !namn || !epost || !arSystemRoll(systemRoll) || aktiv === null) return null

  const titelFranDatabasen = optionalText(data.titel)
  const titel = titelFranDatabasen ?? (arAdministrator(systemRoll) ? 'Administratör' : 'Medarbetare')

  return {
    id,
    namn,
    epost,
    roll: arAdministrator(systemRoll) ? 'administrator' : 'tekniker',
    initialer: initialerFranNamn(namn),
    titel,
    aktiv,
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

function normaliseraMeddelandeRad(data: unknown): Meddelande | null {
  if (!arObjekt(data)) return null
  const id = text(data.id)
  const arendeId = text(data.arende_id)
  const avsandareNamn = text(data.avsandare_namn)
  const meddelandeText = text(data.text)
  const tidpunkt = text(data.tidpunkt)
  const internt = typeof data.internt === 'boolean' ? data.internt : null

  if (
    !id ||
    !arendeId ||
    !arMeddelandeAvsandare(data.avsandare) ||
    !avsandareNamn ||
    !meddelandeText ||
    !tidpunkt ||
    internt === null
  ) {
    return null
  }

  return {
    id,
    arendeId,
    avsandare: data.avsandare,
    avsandareNamn,
    text: meddelandeText,
    tidpunkt,
    internt,
  }
}

function normaliseraAktivitetRad(data: unknown): Aktivitet | null {
  if (!arObjekt(data)) return null
  const id = text(data.id)
  const arendeId = text(data.arende_id)
  const beskrivning = text(data.beskrivning)
  const aktor = text(data.aktor)
  const tidpunkt = text(data.tidpunkt)

  if (!id || !arendeId || !arAktivitetTyp(data.typ) || !beskrivning || !aktor || !tidpunkt) {
    return null
  }

  return {
    id,
    arendeId,
    typ: data.typ,
    beskrivning,
    aktor,
    tidpunkt,
  }
}

function normaliseraKundanteckningRad(data: unknown): Kundanteckning | null {
  if (!arObjekt(data)) return null
  const id = text(data.id)
  const kundId = text(data.kund_id)
  const anteckningText = text(data.text)
  const forfattare = text(data.forfattare)
  const skapad = text(data.skapad)

  if (!id || !kundId || !anteckningText || !forfattare || !skapad) return null

  return {
    id,
    kundId,
    text: anteckningText,
    forfattare,
    skapad,
    uppdaterad: optionalText(data.uppdaterad),
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

function arGiltigtKundnamn(varde: string) {
  return varde.length >= 2 && varde.length <= 160
}

function arGiltigEpost(varde: string) {
  return varde.length >= 3 && varde.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(varde)
}

function arGiltigTelefon(varde: string) {
  return (
    varde.length >= 3 &&
    varde.length <= 40 &&
    /^[+]?[\d\s\-()]+$/.test(varde) &&
    varde.replace(/\D/g, '').length >= 7
  )
}

function arGiltigRubrik(varde: string) {
  return varde.length >= 3 && varde.length <= 180
}

function arGiltigBeskrivning(varde: string) {
  return varde.length >= 5
}

function arPostgresFelkod(error: unknown, kod: string) {
  return arObjekt(error) && error.code === kod
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

function arMeddelandeAvsandare(varde: unknown): varde is Meddelande['avsandare'] {
  return ['kund', 'personal', 'assistent'].includes(String(varde))
}

function arAktivitetTyp(varde: unknown): varde is Aktivitet['typ'] {
  return [
    'skapat',
    'status',
    'prioritet',
    'tilldelning',
    'meddelande',
    'anteckning',
    'bokning',
    'bilaga',
  ].includes(String(varde))
}
