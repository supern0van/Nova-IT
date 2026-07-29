import { OperativtAdminFel } from '@/lib/admin/operativa-server'
import { skapaSupabaseServiceklient } from '@/lib/supabase/service'

const ELKS_API_URL = 'https://api.46elks.com/a1/sms'
const STANDARD_AVSANDARE = 'NovaIT'

/**
 * Skickar ett SMS till kunden om att ärendet är klart och produkten kan
 * hämtas, och loggar utskicket i admin_aktiviteter. Soft-fail-designat på
 * samma sätt som Turnstile: om ELKS_API_USERNAME/ELKS_API_PASSWORD inte är
 * satta kastas ett tydligt, känt fel (`OperativtAdminFel`) i stället för att
 * hela ärendehanteringen kraschar - se docs/contact-form-activation.md för
 * varför den designprincipen finns.
 */
export async function skickaKlarForUpphamtningSms(
  arendeId: string,
  aktor: string,
): Promise<{ skickat: true; till: string }> {
  const username = process.env.ELKS_API_USERNAME
  const password = process.env.ELKS_API_PASSWORD
  if (!username || !password) {
    throw new OperativtAdminFel('SMS-tjänsten är inte konfigurerad ännu.', 503)
  }

  const supabase = skapaSupabaseServiceklient()
  const { data, error } = await supabase
    .from('admin_arenden')
    .select('id, arendenummer, telefon')
    .eq('id', arendeId)
    .single()

  if (error || !data) throw new OperativtAdminFel('Ärendet kunde inte hittas.', 404)

  const telefon = normaliseraSvensktMobilnummer(String(data.telefon ?? ''))
  if (!telefon) {
    throw new OperativtAdminFel('Ärendet saknar ett giltigt mobilnummer att skicka SMS till.', 422)
  }

  const avsandare = process.env.SMS_AVSANDARE || STANDARD_AVSANDARE
  const meddelande = `Nova IT: Ärende ${data.arendenummer} är klart - produkten kan hämtas. Frågor? Kontakta oss.`

  let svar: Response
  try {
    svar = await fetch(ELKS_API_URL, {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ from: avsandare, to: telefon, message: meddelande }).toString(),
    })
  } catch (fetchFel) {
    console.error('Kunde inte nå 46elks.', fetchFel)
    throw new OperativtAdminFel('SMS kunde inte skickas just nu. Försök igen om en stund.', 502)
  }

  if (!svar.ok) {
    const body = await svar.text().catch(() => '')
    console.error('46elks avvisade SMS-utskicket.', svar.status, body)
    throw new OperativtAdminFel('SMS kunde inte skickas just nu. Försök igen om en stund.', 502)
  }

  await supabase.from('admin_aktiviteter').insert({
    arende_id: arendeId,
    typ: 'sms',
    beskrivning: 'SMS skickat till kund: ärendet är klart för upphämtning',
    aktor: aktor || 'Okänd',
  })

  return { skickat: true, till: telefon }
}

/**
 * Normaliserar ett svenskt mobilnummer (lagras löst formaterat, t.ex.
 * "070-448 58 78" eller "+46 70 448 58 78") till internationellt format
 * utan mellanslag (t.ex. "+46704485878"), vilket 46elks kräver. Returnerar
 * null om numret inte går att tolka som ett svenskt mobilnummer.
 */
export function normaliseraSvensktMobilnummer(varde: string): string | null {
  const rensat = varde.replace(/[^\d+]/g, '')
  if (!rensat) return null

  let siffror: string
  if (rensat.startsWith('+46')) {
    siffror = rensat.slice(3)
  } else if (rensat.startsWith('0046')) {
    siffror = rensat.slice(4)
  } else if (rensat.startsWith('46') && rensat.length >= 10) {
    siffror = rensat.slice(2)
  } else if (rensat.startsWith('0')) {
    siffror = rensat.slice(1)
  } else {
    siffror = rensat.startsWith('+') ? '' : rensat
  }

  if (siffror.length < 7 || siffror.length > 12) return null
  return `+46${siffror}`
}
