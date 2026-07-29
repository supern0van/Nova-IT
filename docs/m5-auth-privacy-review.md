# M5 — Auth-, integritets- och missbruksskyddsgranskning

Senast uppdaterad: 2026-07-30

Detta är en operativ säkerhets- och innehållsgranskning av den aktuella
Nova IT-koden och driftsättningen. Den är inte ett formellt penetrationstest
eller juridisk rådgivning. Ägare eller juridiskt ombud behöver slutligt
bekräfta personuppgiftsansvar, leverantörsavtal, överföringar och gallring.

## Omfattning

- `portal/middleware.ts`
- `portal/lib/supabase/proxy.ts`
- `portal/lib/auth/supabase-auth.ts`
- återställning av lösenord och MFA/AAL2-flöden
- Supabase Security Advisor och färska Auth-loggar
- publik integritetspolicy och kakinformation
- Cloudflare Worker-domäner och befintlig rate-limit-regel

## Resultat

### Godkänt i kodgranskningen

- Serverkontroller använder Supabase `getClaims()` och är fail-closed om
  nödvändiga serverhemligheter saknas.
- Skyddade routes kräver autentiserad session och AAL2/MFA där det är
  föreskrivet.
- Session lease, HMAC-verifiering och idle-timeout begränsar återanvändning av
  gamla sessionsdata.
- `next`-redirect valideras som lokal säker sökväg.
- Lösenordsåterställningen använder samma generiska bekräftelse oavsett om
  kontot finns, vilket minskar risken för kontoenumerering.
- Service role används server-side och exponeras inte i klientkoden.
- Lösenordsåterställningen kontrollerar nya lösenord mot Have I Been Pwned
  med k-anonymitet och nekar kända läckta lösenord. Detta är verifierat som
  kundportalens aktiva applikationsskydd.

### Åtgärdat i denna release

- Publikens integritetstext beskriver nu även Turnstile, rate limiting,
  säkerhetsloggar och kundportalens auth-/sessionsdata.
- Integritetsdokumentet är versionsuppdaterat till 1.1 och daterat 30 juli
  2026.
- `portal.nova-it.se` och `portal.novait.se` är flyttade till den separata
  `nova-it-kundportal`-Workern. De finns inte längre i admin-Workerns
  `wrangler.jsonc` eller adminportalens smoke-lista.

### Rate-limit-beslut

Webbplatsens befintliga Cloudflare-regel lämnas oförändrad eftersom den
skyddar `/kontakt*` och `/api/public/intag`. Kundportalens webbläsarkod anropar
Supabase Auth direkt för login och lösenordsåterställning; en rate-limit-regel
på portalens egen host skulle därför inte se själva `/token`- eller
återställningsanropet. Cloudflare beskriver rate limiting som inkommande
förfrågningsregler, så en effektiv Cloudflare-regel för auth kräver att auth
först proxas via Worker, eller att auth-tjänstens egna gränser används.

Supabase Auth-loggarna visar redan `429 over_request_rate_limit` på tokenvägen.
Beslutet för denna release är därför att behålla Supabase Auths inbyggda
skydd och inte lägga till en ineffektiv sidregel. En framtida striktare gräns
kräver antingen verifierad Supabase-konfiguration eller en separat proxad
auth-endpoint.

### Kvarstående manuell kontroll före formell release

- ✅ **Grön och avklarad enligt releasebeslut — läckta lösenord:**
  Kundportalens egen HIBP-kontroll är aktiv och verifierad i
  lösenordsåterställningsflödet. Supabase Security Advisors separata
  Pro-funktion är fortfarande inte aktiverad och kräver uppgradering, men
  detta är accepterat som ett icke-blockerande beslut för den här releasen.
- Bekräfta juridiskt att organisationsnummer, adress, Resend-/Cloudflare-/
  Supabase-roller, eventuella tredjelandsöverföringar och gallringstider
  stämmer med faktiska avtal och arbetssätt.
- Gör ett separat externt penetrationstest om M5 ska användas som bevis på
  oberoende säkerhetsgranskning. Denna granskning är en kod- och
  konfigurationsreview, inte ett sådant test.

## Verifieringsspår

- Security Advisor: Supabase Pro-funktionen för leaked-password protection är
  avstängd; kundportalens HIBP-kontroll är aktiv samt avsiktligt
  stängda interna tabeller utan publika/authenticated-policyer.
- Auth-loggar: både normala login/MFA-händelser och inbyggd 429-begränsning
  observerades; personuppgifter återges inte här.
- Cloudflare rate-limit-regel: `Kontakt och publikt intag - 4 per 10 sekunder
  och IP`, oförändrad.
