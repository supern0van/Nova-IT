/**
 * Skickar ett e-postmeddelande till kunden när personal svarar på ett
 * ärende (icke-internt svar, se laggTillOperativtMeddelande i
 * operativa-server.ts). Innan detta byggdes fick kunden ALDRIG veta att
 * ärendet uppdaterats om hen inte själv råkade kolla kundportalen.
 *
 * Soft-fail (samma princip som Turnstile/SMS/Milstolpe 2:s kontoskapande):
 * meddelandet är redan sparat i databasen och synligt i kundportalen
 * oavsett om det här mejlet går fram - att inte nå Resend ska aldrig
 * blockera själva svaret.
 *
 * Anropas ENDAST om kunden inte opt:at ut (kontakt_uppdatering_epost) - den
 * kontrollen görs av anroparen, INTE här, se operativa-server.ts.
 */
export async function forsokAviseraKundOmSvar(uppgifter: {
  epost: string
  kundNamn: string
  arendenummer: string
  arendeId: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.ARENDE_AVISERING_FROM

  if (!apiKey || !from) {
    console.error(
      'Kundavisering kunde inte skickas - RESEND_API_KEY eller ARENDE_AVISERING_FROM saknas.',
    )
    return
  }

  const kundportalUrl = process.env.KUNDPORTAL_URL ?? 'https://kundportal.nova-it.se'
  const lank = `${kundportalUrl}/mina-arenden/${uppgifter.arendeId}`
  const fornamn = uppgifter.kundNamn.split(' ')[0] || uppgifter.kundNamn

  const subject = `Nytt svar på ditt ärende ${uppgifter.arendenummer}`
  const text = [
    `Hej ${fornamn},`,
    '',
    `Du har fått ett nytt svar på ditt ärende ${uppgifter.arendenummer} hos Nova IT.`,
    '',
    'Logga in på kundportalen för att läsa svaret och svara tillbaka:',
    lank,
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
      console.error('Kundavisering kunde inte skickas.', { status: svar.status })
    }
  } catch (fel) {
    console.error('Kundavisering kunde inte skickas.', fel)
  }
}
