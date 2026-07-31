/**
 * Skickar ett välkomstmejl med inloggningsuppgifter när en NY kund skapas
 * manuellt av personal (skapaOperativKund i operativa-server.ts) och ett
 * kundportalskonto lyckades skapas åt hen (se kundportal-konto-client.ts).
 * Speglar exakt samma mönster som det publika kontaktformulärets egen
 * kundbekräftelse (formatCustomerConfirmationEmail i huvudrepots
 * src/features/contact/contact-submission.ts) - samma text/ton, men utan
 * ett ärendenummer eftersom en manuellt skapad kund inte nödvändigtvis har
 * ett ärende kopplat till just kontoskapandet.
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

  const kundportalUrl = process.env.KUNDPORTAL_URL ?? 'https://kundportal.nova-it.se'
  const fornamn = uppgifter.kundNamn.split(' ')[0] || uppgifter.kundNamn

  const subject = 'Ditt konto hos Nova IT:s kundportal'
  const text = [
    `Hej ${fornamn},`,
    '',
    'Ett konto har skapats åt dig i Nova IT:s kundportal, där du kan följa dina ärenden.',
    '',
    `${kundportalUrl}/logga-in`,
    `E-post: ${uppgifter.epost}`,
    `Tillfälligt lösenord: ${uppgifter.tillfalligtLosenord}`,
    'Du blir ombedd att välja ett eget lösenord första gången du loggar in.',
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
      const kropp = await svar.text()
      console.error('Välkomstmejl kunde inte skickas.', svar.status, kropp)
    }
  } catch (fel) {
    console.error('Välkomstmejl kunde inte skickas.', fel)
  }
}
