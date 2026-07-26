/**
 * Skydd mot "open redirect".
 *
 * Inloggningsflödet kan få en `next`-parameter i query-strängen (satt av
 * proxyn när en oautentiserad användare nekas åtkomst till en skyddad
 * sida, se `lib/supabase/proxy.ts`). Den parametern kommer från URL:en och
 * får ALDRIG användas som omdirigeringsmål utan validering – annars kan
 * någon skicka en länk som ser ut att gå till portalen men omdirigerar
 * vidare till en extern, skadlig webbplats efter lyckad inloggning.
 *
 * Används av både proxyn (server) och inloggningsvyn (klient), så att
 * bägge lagren är överens om vad som räknas som en säker destination.
 *
 * En giltig destination:
 *  - är en sökväg som börjar med exakt ETT "/" (relativ till appen)
 *  - är inte protokollrelativ, dvs har inte "/" eller "\" direkt efter det
 *    första snedstrecket (annars kan webbläsaren tolka den som
 *    "//example.com" eller "/\example.com" och navigera dit)
 *  - innehåller inget schema ("http://", "https:", "javascript:" osv.)
 *  - innehåller inga radbrytningar
 *
 * Returnerar sökvägen oförändrad om den är säker, annars `null` – anroparen
 * ska då falla tillbaka till en hårdkodad standarddestination.
 */
export function sakerOmdirigeringsSokvag(varde: string | null | undefined): string | null {
  if (!varde) return null
  if (!varde.startsWith('/')) return null
  if (/^\/[\\/]/.test(varde)) return null
  if (varde.includes('://')) return null
  if (/[\r\n]/.test(varde)) return null
  return varde
}
