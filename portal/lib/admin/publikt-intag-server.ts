import { skapaSupabaseServiceklient } from '@/lib/supabase/service'
import type { Kategori, Kundtyp, Prioritet } from '@/lib/types'

/**
 * Serverlogik för det publika ärendeintaget från nova-it.se.
 *
 * Anropas ENDAST av `app/api/public/intag/route.ts`, som kräver en delad
 * server-till-server-hemlighet (se `INTAG_SECRET` i den filen) –
 * ingen AAL2-session, ingen adminanvändare. Det är medvetet: en anonym
 * webbplatsbesökare har varken ett portalkonto eller en MFA-verifierad
 * session, så samma autentiseringsväg som adminportalens övriga skrivvägar
 * kan inte återanvändas här. Skrivningarna går ändå mot exakt samma
 * `admin_kunder`/`admin_arenden`/`admin_meddelanden`/`admin_aktiviteter`-
 * tabeller som adminportalen redan använder – inget parallellt datalager.
 */

export class PubliktIntagFel extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message)
  }
}

export interface PubliktIntagUppgifter {
  kalla: 'kontaktformular' | 'supportassistent'
  namn: string
  epost: string
  telefon: string
  kundtyp: Kundtyp
  verksamhetsnamn?: string
  tjanstSlug: string
  angelagenhet: 'planerad' | 'normal' | 'akut'
  meddelande: string
  idempotensnyckel: string
}

export interface PubliktIntagResultat {
  arendenummer: string
  mottagetVid: string
  /** Endast för internt bruk (t.ex. att skicka kundbekräftelse) – returneras aldrig till webbläsaren. */
  arendeId: string
  kundEpost: string
  kundNamn: string
}

const tjanstTillKategori: Record<string, Kategori> = {
  'it-support': 'datorer_vardags_it',
  natverk: 'natverk_wifi',
  datorinstallation: 'installation',
  felsokning: 'datorer_vardags_it',
  'sakerhet-backup': 'sakerhet_virus',
  'microsoft-google': 'konton_moln_sakerhet',
  datorservice: 'datorer_vardags_it',
}

const angelagenhetTillPrioritet: Record<PubliktIntagUppgifter['angelagenhet'], Prioritet> = {
  planerad: 'lag',
  normal: 'normal',
  // Medvetet inte 'kritisk' - den nivån sätts av en administratör efter
  // egen bedömning, inte automatiskt av en oautentiserad besökares eget val.
  akut: 'hog',
}

export async function skapaPubliktIntag(
  uppgifter: PubliktIntagUppgifter,
): Promise<PubliktIntagResultat> {
  const namn = text(uppgifter.namn)
  const epost = normaliseraEpost(uppgifter.epost)
  const telefon = text(uppgifter.telefon)
  const meddelande = text(uppgifter.meddelande)
  const idempotensnyckel = text(uppgifter.idempotensnyckel)

  if (!arGiltigtNamn(namn)) throw new PubliktIntagFel('Ange ett namn med minst två tecken.')
  if (!arGiltigEpost(epost)) throw new PubliktIntagFel('Ange en giltig e-postadress.')
  if (telefon && !arGiltigTelefon(telefon)) {
    throw new PubliktIntagFel('Ange ett giltigt telefonnummer.')
  }
  if (uppgifter.kundtyp !== 'privatperson' && uppgifter.kundtyp !== 'verksamhet') {
    throw new PubliktIntagFel('Ogiltig kundtyp.')
  }
  if (uppgifter.kundtyp === 'verksamhet' && !text(uppgifter.verksamhetsnamn)) {
    throw new PubliktIntagFel('Ange verksamhetens namn.')
  }
  if (!arGiltigMeddelande(meddelande)) {
    throw new PubliktIntagFel('Beskriv ärendet med minst 10 och högst 2000 tecken.')
  }
  if (idempotensnyckel.length < 16 || idempotensnyckel.length > 200) {
    throw new PubliktIntagFel('Ogiltig idempotensnyckel.')
  }
  if (uppgifter.kalla !== 'kontaktformular' && uppgifter.kalla !== 'supportassistent') {
    throw new PubliktIntagFel('Ogiltig källa.')
  }
  const kategori = tjanstTillKategori[uppgifter.tjanstSlug]
  if (!kategori) throw new PubliktIntagFel('Ogiltig tjänst.')
  const prioritet = angelagenhetTillPrioritet[uppgifter.angelagenhet]
  if (!prioritet) throw new PubliktIntagFel('Ogiltig angelägenhet.')

  const supabase = skapaSupabaseServiceklient()

  // Idempotens: samma nyckel har redan skapat ett ärende (dubbelklick,
  // timeout-retry eller flera parallella requests) - returnera det
  // befintliga resultatet i stället för att skapa ett nytt ärende.
  const { data: befintligt, error: befintligtFel } = await supabase
    .from('admin_arenden')
    .select('id, arendenummer, skapad, epost, kund_namn')
    .eq('idempotensnyckel', idempotensnyckel)
    .maybeSingle()

  if (befintligtFel) throw new Error('Kunde inte kontrollera tidigare inskickning.')
  if (befintligt) {
    return {
      arendenummer: String(befintligt.arendenummer),
      mottagetVid: String(befintligt.skapad),
      arendeId: String(befintligt.id),
      kundEpost: String(befintligt.epost),
      kundNamn: String(befintligt.kund_namn),
    }
  }

  const kund = await hittaEllerSkapaKund(supabase, {
    namn,
    epost,
    telefon,
    kundtyp: uppgifter.kundtyp,
    verksamhetsnamn: uppgifter.verksamhetsnamn,
  })

  const arendenummer = await nastaArendenummerForPubliktIntag(supabase)
  const { data: arendeRad, error: arendeFel } = await supabase
    .from('admin_arenden')
    .insert({
      arendenummer,
      rubrik: rubrikFranMeddelande(meddelande),
      kund_id: kund.id,
      kund_namn: kund.namn,
      kundtyp: kund.kundtyp,
      organisation: kund.organisation,
      epost: kund.epost,
      telefon: kund.telefon,
      kategori,
      underkategori: '',
      prioritet,
      kanal: uppgifter.kalla,
      beskrivning: meddelande,
      idempotensnyckel,
    })
    .select('id, arendenummer, skapad')
    .single()

  if (arendeFel) {
    if (arPostgresFelkod(arendeFel, '23505')) {
      // En parallell request med samma nyckel hann skapa ärendet först
      // mellan vår SELECT och INSERT - läs och returnera det i stället.
      const { data: kapplopare } = await supabase
        .from('admin_arenden')
        .select('id, arendenummer, skapad, epost, kund_namn')
        .eq('idempotensnyckel', idempotensnyckel)
        .maybeSingle()
      if (kapplopare) {
        return {
          arendenummer: String(kapplopare.arendenummer),
          mottagetVid: String(kapplopare.skapad),
          arendeId: String(kapplopare.id),
          kundEpost: String(kapplopare.epost),
          kundNamn: String(kapplopare.kund_namn),
        }
      }
    }
    throw new Error('Kunde inte skapa ärendet.')
  }

  const arendeId = String(arendeRad.id)
  const nu = new Date().toISOString()

  await Promise.all([
    supabase.from('admin_kunder').update({ senaste_kontakt: nu }).eq('id', kund.id),
    supabase.from('admin_meddelanden').insert({
      arende_id: arendeId,
      avsandare: 'kund',
      avsandare_namn: kund.namn,
      text: meddelande,
      internt: false,
      tidpunkt: nu,
    }),
    supabase.from('admin_aktiviteter').insert({
      arende_id: arendeId,
      typ: 'skapat',
      beskrivning: `Ärende inkom via ${uppgifter.kalla === 'kontaktformular' ? 'kontaktformuläret' : 'supportassistenten'} på nova-it.se`,
      aktor: kund.namn,
    }),
  ])

  return {
    arendenummer: String(arendeRad.arendenummer),
    mottagetVid: String(arendeRad.skapad),
    arendeId,
    kundEpost: kund.epost,
    kundNamn: kund.namn,
  }
}

/**
 * Uppdaterar bekräftelsestatusen för ett publikt intaget ärende. Frikopplad
 * från ärendets egen status - ett misslyckat e-postutskick ska aldrig synas
 * som att ärendet självt är trasigt.
 */
export async function sattBekraftelseStatus(
  arendeId: string,
  status: 'skickad' | 'misslyckad',
): Promise<void> {
  if (!text(arendeId)) return
  const supabase = skapaSupabaseServiceklient()
  await supabase.from('admin_arenden').update({ bekraftelse_status: status }).eq('id', arendeId)
}

async function hittaEllerSkapaKund(
  supabase: ReturnType<typeof skapaSupabaseServiceklient>,
  uppgifter: {
    namn: string
    epost: string
    telefon: string
    kundtyp: Kundtyp
    verksamhetsnamn?: string
  },
) {
  // Matchning görs enbart på exakt (normaliserad) e-postadress - den enda
  // signal som är tillräckligt säker för att automatiskt anta att det är
  // samma kund. Efternamn eller e-postdomän räcker inte (se uppdragets
  // krav om att inte blanda ihop personer på lösa grunder).
  const { data: befintlig, error } = await supabase
    .from('admin_kunder')
    .select('*')
    .eq('epost', uppgifter.epost)
    .maybeSingle()

  if (error) throw new Error('Kunde inte slå upp kund.')
  if (befintlig) {
    return {
      id: String(befintlig.id),
      namn: String(befintlig.namn),
      epost: String(befintlig.epost),
      telefon: String(befintlig.telefon),
      kundtyp: befintlig.kundtyp as Kundtyp,
      organisation: befintlig.organisation as string | null | undefined,
    }
  }

  const { data: nyRad, error: skapaFel } = await supabase
    .from('admin_kunder')
    .insert({
      namn: uppgifter.namn,
      kundtyp: uppgifter.kundtyp,
      organisation: uppgifter.kundtyp === 'verksamhet' ? text(uppgifter.verksamhetsnamn) : null,
      epost: uppgifter.epost,
      telefon: uppgifter.telefon || 'Ej angivet',
      adress: '',
      ort: '',
    })
    .select('*')
    .single()

  if (skapaFel) throw new Error('Kunde inte skapa kund.')

  return {
    id: String(nyRad.id),
    namn: String(nyRad.namn),
    epost: String(nyRad.epost),
    telefon: String(nyRad.telefon),
    kundtyp: nyRad.kundtyp as Kundtyp,
    organisation: nyRad.organisation as string | null | undefined,
  }
}

async function nastaArendenummerForPubliktIntag(
  supabase: ReturnType<typeof skapaSupabaseServiceklient>,
): Promise<string> {
  const { data, error } = await supabase.rpc('nasta_admin_arendenummer')
  if (error || typeof data !== 'string' || !data) {
    throw new Error('Kunde inte beräkna ärendenummer.')
  }
  return data
}

function rubrikFranMeddelande(meddelande: string): string {
  const forstaRaden = meddelande.split('\n')[0].trim()
  const rubrik = forstaRaden.length >= 3 ? forstaRaden : meddelande
  return rubrik.length > 180 ? `${rubrik.slice(0, 177)}...` : rubrik
}

function text(varde: unknown): string {
  return typeof varde === 'string' ? varde.trim() : ''
}

function normaliseraEpost(varde: unknown): string {
  return text(varde).toLowerCase()
}

function arGiltigtNamn(varde: string): boolean {
  return varde.length >= 2 && varde.length <= 160
}

function arGiltigEpost(varde: string): boolean {
  return (
    varde.length >= 3 && varde.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(varde)
  )
}

function arGiltigTelefon(varde: string): boolean {
  return varde.length >= 3 && varde.length <= 40 && varde.replace(/\D/g, '').length >= 7
}

function arGiltigMeddelande(varde: string): boolean {
  if (varde.length < 10 || varde.length > 2000) return false
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(varde)) return false
  return true
}

function arPostgresFelkod(fel: unknown, kod: string): boolean {
  return typeof fel === 'object' && fel !== null && 'code' in fel && fel.code === kod
}
