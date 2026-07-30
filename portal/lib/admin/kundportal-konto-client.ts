/**
 * Delad klient för att skapa ett kundportalskonto åt en kund - anropas från
 * BÅDA ställena en ny kund kan uppstå: det publika kontaktformuläret
 * (publikt-intag-server.ts) och personalens egen "Ny kund"-dialog
 * (operativa-server.ts, skapaOperativKund). Kunden ska få tillgång till
 * kundportalen oavsett vilken väg in som skapade kontot.
 *
 * Anropar kundportalens egna, skyddade `/api/internal/kundkonto` (samma
 * mönster som `INTAG_SECRET` mellan den publika sajten och adminportalen,
 * men med ett HELT EGET hemlighetsvärde, `KUNDPORTAL_INTAG_SECRET`).
 * Soft-fail: om kundportalen inte kan nås, eller
 * `KUNDPORTAL_URL`/`KUNDPORTAL_INTAG_SECRET` saknas, loggas det och
 * `undefined` returneras - kunden/ärendet som redan skapats påverkas aldrig
 * av detta.
 */
export interface KundportalKontoResultat {
  kontoSkapat: boolean
  tillfalligtLosenord?: string
}

export async function forsokSkapaKundportalKonto(
  adminKundId: string,
  epost: string,
): Promise<KundportalKontoResultat | undefined> {
  const kundportalUrl = process.env.KUNDPORTAL_URL
  const hemlighet = process.env.KUNDPORTAL_INTAG_SECRET

  if (!kundportalUrl || !hemlighet) {
    console.error('Kundportalskonto kunde inte skapas - KUNDPORTAL_URL eller KUNDPORTAL_INTAG_SECRET saknas.')
    return undefined
  }

  try {
    const svar = await fetch(`${kundportalUrl}/api/internal/kundkonto`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-kundportal-intag-secret': hemlighet,
      },
      body: JSON.stringify({ adminKundId, epost }),
    })

    const kropp = (await svar.json().catch(() => null)) as {
      ok?: boolean
      kontoSkapat?: boolean
      tillfalligtLosenord?: string
    } | null

    if (!svar.ok || !kropp?.ok) {
      console.error('Kundportalen avvisade kontoskapandet.', svar.status, kropp)
      return undefined
    }

    return {
      kontoSkapat: kropp.kontoSkapat === true,
      tillfalligtLosenord:
        typeof kropp.tillfalligtLosenord === 'string' ? kropp.tillfalligtLosenord : undefined,
    }
  } catch (fel) {
    console.error('Kunde inte nå kundportalen för kontoskapande.', fel)
    return undefined
  }
}
