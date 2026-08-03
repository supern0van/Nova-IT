/**
 * Skickar ett välkomstmejl när en NY kund skapas manuellt av personal
 * (skapaOperativKund i operativa-server.ts) och ett kundportalskonto
 * lyckades skapas åt hen (se kundportal-konto-client.ts). Speglar samma
 * mönster som det publika kontaktformulärets egen kundbekräftelse
 * (formatCustomerConfirmationEmail i huvudrepots
 * src/features/contact/contact-submission.ts), men UTAN inloggnings-
 * instruktioner: kundportalen loggar in med ärendenummer (se
 * lib/supabase/kund-konto-grindar.ts i kundportalrepot), och en manuellt
 * skapad kund har inte nödvändigtvis något ärende kopplat till just
 * kontoskapandet - det tillfälliga lösenordet finns redan (satt här), men
 * kunden kan inte logga in förrän ett ärende finns och gett dem ett
 * ärendenummer att logga in med. Det mejlet (formatCustomerConfirmationEmail)
 * innehåller de faktiska inloggningsuppgifterna.
 *
 * Soft-fail (samma princip som forsokAviseraKundOmSvar): kontot är redan
 * skapat oavsett om mejlet går fram - att inte nå Resend ska aldrig
 * blockera kundskapandet.
 */
export async function forsokSkickaValkomstmejl(uppgifter: {
  epost: string
  kundNamn: string
  tillfalligtLosenord: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.ARENDE_AVISERING_FROM

  if (!apiKey || !from) {
    console.error('Välkomstmejl kunde inte skickas - RESEND_API_KEY eller ARENDE_AVISERING_FROM saknas.')
    return
  }

  const fornamn = uppgifter.kundNamn.split(' ')[0] || uppgifter.kundNamn

  const subject = 'Ditt konto hos Nova IT:s kundportal'
  const text = [
    `Hej ${fornamn},`,
    '',
    'Ett konto har förberetts åt dig i Nova IT:s kundportal, där du kan följa dina ärenden.',
    '',
    'Så snart ditt första ärende registreras hos oss får du ett ärendenummer att logga in med,',
    'tillsammans med lösenordet nedan.',
    '',
    `Lösenord: ${uppgifter.tillfalligtLosenord}`,
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
    }
  } catch (fel) {
    console.error('Välkomstmejl kunde inte skickas.', fel)
  }
}
