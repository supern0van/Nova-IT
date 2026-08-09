import { optionalText } from '@/lib/admin/validering'

/**
 * Skickar ett välkomstmejl när ett NYTT kundportalskonto skapas åt en kund
 * (se kundportal-konto-client.ts) - antingen när personal skapar en ny kund
 * manuellt (skapaOperativKund) eller när personal registrerar ett ärende
 * manuellt åt en kund som ännu inte har något konto (skapaOperativtArende).
 * Speglar samma mönster som det publika kontaktformulärets egen
 * kundbekräftelse (formatCustomerConfirmationEmail i huvudrepots
 * src/features/contact/contact-submission.ts), men den funktionen går inte
 * att återanvända här - `portal/` är en egen, fristående Next.js-app i
 * samma repo, inte samma körtid som huvudsajten.
 *
 * `arendenummer` är valfritt: kundportalen loggar in med ärendenummer (se
 * lib/supabase/kund-konto-grindar.ts i kundportalrepot), så utan ett
 * ärende kan kunden ännu inte logga in - texten anpassas efter om ett
 * ärendenummer finns när mejlet skickas eller inte.
 *
 * `atersallt`: satt av "Skicka nya inloggningsuppgifter"-åtgärden när
 * kunden redan hade ett konto och fått ett HELT NYTT lösenord (aldrig
 * samma som tidigare, se skickaNyaInloggningsuppgifter i
 * kundportalrepot). Ändrar bara formuleringen - "kontot förberetts" vore
 * missvisande när kontot redan fanns sedan innan.
 *
 * Soft-fail (samma princip som forsokAviseraKundOmSvar): kontot är redan
 * skapat/uppdaterat oavsett om mejlet går fram - att inte nå Resend ska
 * aldrig blockera kund-, ärende- eller återställningsflödet.
 */
export async function forsokSkickaValkomstmejl(uppgifter: {
  epost: string
  kundNamn: string
  tillfalligtLosenord: string
  arendenummer?: string
  atersallt?: boolean
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.ARENDE_AVISERING_FROM

  if (!apiKey || !from) {
    console.error('Välkomstmejl kunde inte skickas - RESEND_API_KEY eller ARENDE_AVISERING_FROM saknas.')
    return false
  }

  const fornamn = uppgifter.kundNamn.split(' ')[0] || uppgifter.kundNamn
  const arendenummer = optionalText(uppgifter.arendenummer)
  const kundportalUrl = process.env.KUNDPORTAL_URL ?? 'https://kundportal.nova-it.se'
  const loginUrl = `${kundportalUrl.replace(/\/$/, '')}/logga-in`

  const subject = uppgifter.atersallt
    ? 'Nytt lösenord till Nova IT:s kundportal'
    : 'Ditt konto hos Nova IT:s kundportal'

  const inledning = uppgifter.atersallt
    ? 'Vi har skickat nya inloggningsuppgifter till dig för Nova IT:s kundportal.'
    : 'Ett konto har förberetts åt dig i Nova IT:s kundportal, där du kan följa dina ärenden.'

  const text = arendenummer
    ? [
        `Hej ${fornamn},`,
        '',
        inledning,
        '',
        `Ärendenummer: ${arendenummer}`,
        `Lösenord: ${uppgifter.tillfalligtLosenord}`,
        '',
        `Logga in i Kundportalen: ${loginUrl}`,
        '',
        'Hälsningar,',
        'Nova IT',
      ].join('\n')
    : [
        `Hej ${fornamn},`,
        '',
        inledning,
        '',
        'Så snart ditt första ärende registreras hos oss får du ett ärendenummer att logga in med,',
        'tillsammans med lösenordet nedan.',
        '',
        `Lösenord: ${uppgifter.tillfalligtLosenord}`,
        '',
        `Logga in i Kundportalen: ${loginUrl}`,
        '',
        'Hälsningar,',
        'Nova IT',
      ].join('\n')

  try {
    const svar = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Nova-IT-adminportal/1.0',
      },
      body: JSON.stringify({ from, to: [uppgifter.epost], subject, text }),
    })

    if (!svar.ok) {
      await svar.body?.cancel().catch(() => undefined)
      console.error('Välkomstmejl kunde inte skickas.', { status: svar.status })
      return false
    }
    return true
  } catch (fel) {
    console.error('Välkomstmejl kunde inte skickas.', fel)
    return false
  }
}
