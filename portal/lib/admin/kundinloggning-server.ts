import { forsokSkickaNyaInloggningsuppgifter } from '@/lib/admin/kundportal-konto-client'
import { forsokSkickaValkomstmejl } from '@/lib/admin/kundportal-valkomst-server'
import { OperativtAdminFel } from '@/lib/admin/operativa-server'
import { skapaSupabaseServiceklient } from '@/lib/supabase/service'

export interface SkickaNyaInloggningsuppgifterResultat {
  kontoSkapat: boolean
  kontoAterstallt: boolean
}

/**
 * "Skicka nya inloggningsuppgifter" - explicit adminåtgärd för en kund som
 * tappat bort sitt första mejl eller aldrig loggat in. Triggas från en
 * ärendedetaljsida (samma mönster som skickaKlarForUpphamtningSms i
 * sms-server.ts), så att rätt ärendenummer alltid går med i mejlet.
 *
 * Skickar ALDRIG om samma lösenord - se skickaNyaInloggningsuppgifter i
 * kundportalrepotens lib/admin/kundkonto-server.ts, som antingen skapar
 * kontot (om det saknas) eller genererar ett helt nytt tillfälligt
 * lösenord (om kontot redan finns).
 */
export async function skickaNyaInloggningsuppgifterForArende(
  arendeId: string,
  aktor: string,
): Promise<SkickaNyaInloggningsuppgifterResultat> {
  const supabase = skapaSupabaseServiceklient()
  const { data, error } = await supabase
    .from('admin_arenden')
    .select('id, arendenummer, kund_id, kund_namn, epost')
    .eq('id', arendeId)
    .single()

  if (error || !data) throw new OperativtAdminFel('Ärendet kunde inte hittas.', 404)
  if (!data.epost) throw new OperativtAdminFel('Kunden saknar en e-postadress att skicka till.', 422)

  const resultat = await forsokSkickaNyaInloggningsuppgifter(String(data.kund_id), String(data.epost))
  if (!resultat?.tillfalligtLosenord) {
    throw new OperativtAdminFel('Kundportalen kunde inte nås just nu. Försök igen om en stund.', 502)
  }

  await forsokSkickaValkomstmejl({
    epost: String(data.epost),
    kundNamn: String(data.kund_namn),
    tillfalligtLosenord: resultat.tillfalligtLosenord,
    arendenummer: String(data.arendenummer),
    atersallt: resultat.kontoAterstallt,
  })

  await supabase.from('admin_aktiviteter').insert({
    arende_id: arendeId,
    typ: 'kundinloggning',
    beskrivning: resultat.kontoAterstallt
      ? 'Nya inloggningsuppgifter (nytt lösenord) skickade till kunden'
      : 'Kundportalskonto skapat och inloggningsuppgifter skickade till kunden',
    aktor: aktor || 'Okänd',
  })

  return { kontoSkapat: resultat.kontoSkapat, kontoAterstallt: resultat.kontoAterstallt }
}
