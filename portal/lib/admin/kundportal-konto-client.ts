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
      signal: AbortSignal.timeout(8000),
    })

    const kropp = (await svar.json().catch(() => null)) as {
      ok?: boolean
      kontoSkapat?: boolean
      tillfalligtLosenord?: string
    } | null

    if (!svar.ok || !kropp?.ok) {
      // Logga ALDRIG hela kropp-objektet - det kan i vissa svarsformer
      // innehålla tillfalligtLosenord i klartext. Bara statuskod och
      // ok-fältet är säkra att skriva till serverloggarna.
      console.error('Kundportalen avvisade kontoskapandet.', svar.status, { ok: kropp?.ok })
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

/**
 * Tar bort kundens kundportalskonto när kunden raderas i adminportalen (se
 * taBortOperativKund). Soft-fail av samma skäl som ovan: en oåtkomlig
 * kundportal ska aldrig blockera personal från att radera en kund här -
 * felet loggas, OCH returneras som `false` så att taBortOperativKund kan
 * föra vidare en varning till personalen (i stället för att bara tyst
 * svälja felet - annars kan en kund behålla portalinloggningen efter att
 * ha "tagits bort" utan att någon märker det).
 */
export async function forsokTaBortKundportalKonto(adminKundId: string): Promise<boolean> {
  const kundportalUrl = process.env.KUNDPORTAL_URL
  const hemlighet = process.env.KUNDPORTAL_INTAG_SECRET

  if (!kundportalUrl || !hemlighet) {
    console.error('Kundportalskonto kunde inte tas bort - KUNDPORTAL_URL eller KUNDPORTAL_INTAG_SECRET saknas.')
    return false
  }

  try {
    const svar = await fetch(`${kundportalUrl}/api/internal/kundkonto`, {
      method: 'DELETE',
      headers: {
        'content-type': 'application/json',
        'x-kundportal-intag-secret': hemlighet,
      },
      body: JSON.stringify({ adminKundId }),
      signal: AbortSignal.timeout(8000),
    })

    if (!svar.ok) {
      console.error('Kundportalen avvisade kontoborttagningen.', svar.status)
      return false
    }

    return true
  } catch (fel) {
    console.error('Kunde inte nå kundportalen för kontoborttagning.', fel)
    return false
  }
}
