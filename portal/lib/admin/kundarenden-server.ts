import { skapaSupabaseServiceklient } from '@/lib/supabase/service'
import type { ArendeStatus, Prioritet } from '@/lib/types'

/**
 * Serverlogik för kundportalens läs- och svarsflöde (Milstolpe 3/4, se
 * docs/kundportal-planering.md i huvudrepot).
 *
 * Anropas ENDAST av `app/api/internal/kundarenden*`- och
 * `app/api/internal/kundmeddelande/route.ts`, som kräver en delad
 * server-till-server-hemlighet (`ADMINPORTAL_INTAG_SECRET`) – samma mönster
 * som `INTAG_SECRET` (publika sajten → adminportalen) och
 * `KUNDPORTAL_INTAG_SECRET` (adminportalen → kundportalen), men i den nya
 * riktningen kundportalen → adminportalen. Varje gräns har sitt eget,
 * distinkta hemlighetsvärde.
 *
 * `adminKundId` kommer ALDRIG från en obetrodd källa – kundportalen slår
 * först upp den inloggade kundens egen `kund_konton.admin_kund_id` server-
 * side (verifierad Supabase-session, se dess `route-anvandare.ts`) och
 * skickar bara med det värdet. Varje funktion här verifierar ändå på nytt
 * att ärendet faktiskt tillhör den `adminKundId` som skickades med – en kund
 * ska aldrig kunna se eller svara på någon annans ärende.
 */

export class KundArendeFel extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message)
  }
}

export interface KundArendeSammanfattning {
  id: string
  arendenummer: string
  rubrik: string
  status: ArendeStatus
  prioritet: Prioritet
  skapad: string
  uppdaterad: string
}

export interface KundMeddelande {
  id: string
  avsandare: 'kund' | 'personal' | 'assistent'
  avsandareNamn: string
  text: string
  tidpunkt: string
}

export interface KundArendeDetalj extends KundArendeSammanfattning {
  meddelanden: KundMeddelande[]
}

/**
 * Alla ärenden för en given kund, senast uppdaterade först. Aldrig fler
 * fält än nödvändigt – ingen intern routning (ansvarig_id), inga interna
 * anteckningar, inga andra kunders data.
 */
/**
 * Slår upp vilken kund (adminKundId) ett givet ärendenummer tillhör -
 * används av kundportalens inloggning (kunden loggar in med valfritt av
 * sina egna ärendenummer + lösenord, se docs/kundportal-planering.md).
 * Returnerar `null` om ärendenumret inte finns, utan att avslöja mer än så.
 */
export async function hamtaKundIdForArendenummer(arendenummer: string): Promise<string | null> {
  const supabase = skapaSupabaseServiceklient()
  const { data, error } = await supabase
    .from('admin_arenden')
    .select('kund_id')
    .eq('arendenummer', arendenummer)
    .maybeSingle()

  if (error) throw new KundArendeFel('Kunde inte slå upp ärendenumret.', 500)
  return data ? String(data.kund_id) : null
}

export async function hamtaKundArenden(adminKundId: string): Promise<KundArendeSammanfattning[]> {
  const supabase = skapaSupabaseServiceklient()
  const { data, error } = await supabase
    .from('admin_arenden')
    .select('id, arendenummer, rubrik, status, prioritet, skapad, uppdaterad')
    .eq('kund_id', adminKundId)
    .order('uppdaterad', { ascending: false })

  if (error) throw new KundArendeFel('Kunde inte hämta ärenden.', 500)

  return (data ?? []).map((rad) => ({
    id: String(rad.id),
    arendenummer: String(rad.arendenummer),
    rubrik: String(rad.rubrik),
    status: rad.status as ArendeStatus,
    prioritet: rad.prioritet as Prioritet,
    skapad: String(rad.skapad),
    uppdaterad: String(rad.uppdaterad),
  }))
}

/**
 * Ett enskilt ärende med dess konversation. Interna meddelanden/anteckningar
 * (`internt: true`) filtreras alltid bort – de är avsedda för personal, inte
 * kunden. Returnerar `null` om ärendet inte finns ELLER tillhör en annan
 * kund – samma svar i båda fallen, för att aldrig avslöja att ett annat
 * ärende-id existerar.
 */
export async function hamtaKundArende(
  adminKundId: string,
  arendeId: string,
): Promise<KundArendeDetalj | null> {
  const supabase = skapaSupabaseServiceklient()

  const { data: arende, error: arendeFel } = await supabase
    .from('admin_arenden')
    .select('id, arendenummer, rubrik, status, prioritet, skapad, uppdaterad, kund_id')
    .eq('id', arendeId)
    .maybeSingle()

  if (arendeFel) throw new KundArendeFel('Kunde inte hämta ärendet.', 500)
  if (!arende || String(arende.kund_id) !== adminKundId) return null

  const { data: meddelanden, error: meddelandeFel } = await supabase
    .from('admin_meddelanden')
    .select('id, avsandare, avsandare_namn, text, tidpunkt')
    .eq('arende_id', arendeId)
    .eq('internt', false)
    .order('tidpunkt', { ascending: true })

  if (meddelandeFel) throw new KundArendeFel('Kunde inte hämta konversationen.', 500)

  return {
    id: String(arende.id),
    arendenummer: String(arende.arendenummer),
    rubrik: String(arende.rubrik),
    status: arende.status as ArendeStatus,
    prioritet: arende.prioritet as Prioritet,
    skapad: String(arende.skapad),
    uppdaterad: String(arende.uppdaterad),
    meddelanden: (meddelanden ?? []).map((rad) => ({
      id: String(rad.id),
      avsandare: rad.avsandare as KundMeddelande['avsandare'],
      avsandareNamn: String(rad.avsandare_namn),
      text: String(rad.text),
      tidpunkt: String(rad.tidpunkt),
    })),
  }
}

/**
 * Sparar ett kundinitierat svar på ett öppet ärende (Milstolpe 4). Nekar om
 * ärendet tillhör en annan kund (404, samma svar som "finns inte") eller är
 * stängt (409). Om ärendet stod och väntade på kunden (`vantar_pa_kund`)
 * går det automatiskt vidare till `pagaende` – det väntar inte längre på
 * kunden när kunden precis har svarat.
 */
export async function skapaKundMeddelande(uppgifter: {
  adminKundId: string
  arendeId: string
  text: string
}): Promise<KundMeddelande> {
  const text = uppgifter.text.trim()
  if (!text) throw new KundArendeFel('Meddelandet kan inte vara tomt.', 400)
  if (text.length > 4000) throw new KundArendeFel('Meddelandet är för långt.', 400)

  const supabase = skapaSupabaseServiceklient()

  const { data: arende, error: arendeFel } = await supabase
    .from('admin_arenden')
    .select('id, kund_id, kund_namn, status')
    .eq('id', uppgifter.arendeId)
    .maybeSingle()

  if (arendeFel) throw new KundArendeFel('Kunde inte hämta ärendet.', 500)
  if (!arende || String(arende.kund_id) !== uppgifter.adminKundId) {
    throw new KundArendeFel('Ärendet hittades inte.', 404)
  }
  if (arende.status === 'stangd') {
    throw new KundArendeFel('Ärendet är stängt och tar inte emot fler svar.', 409)
  }

  const nu = new Date().toISOString()
  const nastaStatus = arende.status === 'vantar_pa_kund' ? 'pagaende' : arende.status

  const { data: meddelandeRad, error: meddelandeFel } = await supabase
    .from('admin_meddelanden')
    .insert({
      arende_id: uppgifter.arendeId,
      avsandare: 'kund',
      avsandare_namn: arende.kund_namn,
      text,
      internt: false,
      tidpunkt: nu,
    })
    .select('id, avsandare, avsandare_namn, text, tidpunkt')
    .single()

  if (meddelandeFel || !meddelandeRad) throw new KundArendeFel('Kunde inte spara meddelandet.', 500)

  await Promise.all([
    supabase.from('admin_arenden').update({ status: nastaStatus }).eq('id', uppgifter.arendeId),
    supabase.from('admin_kunder').update({ senaste_kontakt: nu }).eq('id', uppgifter.adminKundId),
    supabase.from('admin_aktiviteter').insert({
      arende_id: uppgifter.arendeId,
      typ: 'meddelande',
      beskrivning: 'Kunden svarade via kundportalen',
      aktor: String(arende.kund_namn),
    }),
  ])

  return {
    id: String(meddelandeRad.id),
    avsandare: meddelandeRad.avsandare as KundMeddelande['avsandare'],
    avsandareNamn: String(meddelandeRad.avsandare_namn),
    text: String(meddelandeRad.text),
    tidpunkt: String(meddelandeRad.tidpunkt),
  }
}
