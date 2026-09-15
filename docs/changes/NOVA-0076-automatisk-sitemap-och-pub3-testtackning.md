---
id: NOVA-0076
date: 2026-09-13
date_precision: day
type: added
status: completed
systems:
  - public-site
---

# Automatiskt genererad sitemap.xml + saknad enhetstestäckning för PUB-3

## Vad ändrades?

- **Ny:** `scripts/generate-sitemap.mjs`. Genererar `public/sitemap.xml`
  från de FAKTISKA routorna i `src/routes/` (läser `createFileRoute(...)`,
  utesluter layoutroutor och omdirigeringar, expanderar tjänste-`$slug`
  mot `lib/nova-data.ts`) i stället för den tidigare handhållna filen.
  Körs automatiskt som första steget i `bun run build`
  (`package.json`: `"build": "bun run sitemap && vite build"`). Ett
  konkret exempel på exakt det problem detta löser: `/assistent` saknades
  helt i den gamla, handhållna sitemapen trots att sidan redan fanns i
  produktion.
- **Nytt (regressionstest):** två fall i `contact-server.test.ts` som
  täcker att `skickaKontaktforfragan` faktiskt ANROPAR PUB-3-spärren
  (`arKontaktformularIpSparrad`) och avvisar korrekt, INNAN
  honeypot/tidskontroll/Turnstile körs. Detta var tidigare en lucka:
  `contact-ratelimit.test.ts` testade bara hjälpfunktionen isolerat, inte
  att den faktiska affärslogiken använder den rätt.

## Varför?

En bred granskning (2026-09-13) identifierade den handhållna sitemapen
som en återkommande risk (en ny sida glöms lätt bort) och avsaknaden av
PUB-3-integrationstäckning som en verklig testlucka - servergrenen som
faktiskt kopplar samman hastighetsspärren med kontaktformulärets
inskickningsflöde hade noll testtäckning.

En parallell idé (E2E-tester för kontaktformulärets felvägar) övervägdes
men valdes bort: klienten (`kontakt.tsx`) visar redan medvetet SAMMA
generiska felmeddelande oavsett vilken serverkontroll som stoppade
inskicket (för att inte avslöja vilken spamkontroll som slog till) - ett
nytt E2E-test hade bara upprepat det redan existerande regressionstestet
för ett generiskt fel, utan att täcka något nytt. Den verkliga luckan låg
i backend-integrationen, inte i UI:t.

## Resultat

- `bun run build` skriver alltid en sitemap som matchar de faktiska
  routorna - en ny sida kan inte längre glömmas bort i den.
- `bun run test` (168/168, upp från 166), typecheck, lint (0 fel) och
  build är alla gröna.
- PUB-3-spärrens faktiska koppling till kontaktformuläret är nu
  regressionstestad, inte bara dess isolerade hjälpfunktion.

## Dokumentationspåverkan

Ingen.
