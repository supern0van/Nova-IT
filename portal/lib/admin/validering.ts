/**
 * Delade valideringshjälpare för operativa-server.ts (personalens egna
 * "Ny kund"/"Nytt ärende"-flöden) och publikt-intag-server.ts (det publika
 * kontaktformuläret på nova-it.se). Låg tidigare duplicerad, verbatim i
 * bägge filerna - med ETT verkligt glapp som redan hunnit uppstå:
 * publikt-intag-server.ts:s arGiltigTelefon saknade teckenbegränsningen
 * som operativa-server.ts:s version hade, vilket lät ett telefonnummer med
 * godtyckliga tecken (bara siffror/längd kontrollerades) komma in via det
 * publika formuläret men inte via personalens egna dialoger. Denna fil är
 * nu den enda källan, med den STRÄNGARE varianten av telefonvalidering -
 * det publika formuläret är den mest exponerade ingången och bör inte
 * vara den svagare av de två.
 */

export function text(varde: unknown): string {
  return typeof varde === 'string' ? varde.trim() : ''
}

export function optionalText(varde: unknown): string | undefined {
  const normaliserat = text(varde)
  return normaliserat || undefined
}

export function nullableText(varde: unknown): string | null {
  const normaliserat = text(varde)
  return normaliserat || null
}

export function arGiltigtNamn(varde: string): boolean {
  return varde.length >= 2 && varde.length <= 160
}

export function arGiltigEpost(varde: string): boolean {
  return varde.length >= 3 && varde.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(varde)
}

export function arGiltigTelefon(varde: string): boolean {
  return (
    varde.length >= 3 &&
    varde.length <= 40 &&
    /^[+]?[\d\s\-()]+$/.test(varde) &&
    varde.replace(/\D/g, '').length >= 7
  )
}

export function arPostgresFelkod(fel: unknown, kod: string): boolean {
  return typeof fel === 'object' && fel !== null && 'code' in fel && fel.code === kod
}
