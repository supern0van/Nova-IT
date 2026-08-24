---
id: NOVA-0064
date: 2026-08-24
date_precision: day
type: added
status: completed
systems:
  - publik-webbplats
---

# Komponenttestinfrastruktur + tester för PortalMeny (Fas P3)

## Vad ändrades?

- Ny DOM-testinfrastruktur för `bun test`: `@testing-library/react`,
  `@testing-library/dom`, `happy-dom` och `@happy-dom/global-registrator`
  som nya dev-beroenden, en `happydom.ts`-preload-fil och en
  `[test].preload`-rad i `bunfig.toml`.
- `src/components/portal-meny.test.tsx` (ny): tre tester av
  sidhuvudets inloggningspanel - formuläret postar med rätt
  fält/action till kundportalens `logga-in-form`-endpoint, inskicket
  blockeras med ett synligt fel om Turnstile-token saknas, och
  lösenordsvisningen växlar korrekt.
- `test`-scriptet i `package.json` utökat till att köra
  `src/components` (var bara `src/features`).

## Varför?

`src/routes/` och `src/components/` hade noll automatiserade tester
trots att affärslogiken i `src/features/` redan var väl testad -
UI-lagret som binder ihop dem (formulär, inloggningspanel) kunde bara
fångas av manuell granskning eller build/typecheck. `PortalMeny.tsx` är
den enda inloggningsvägen för kunder direkt från startsidans
sidhuvud, så den prioriterades.

`kontakt.tsx` ingår MEDVETET INTE i den här batchen - se
`docs/changes/`-historiken/plandokumentet för resonemanget
(hård koppling till `Route.useSearch()`, skulle kräva en full
TanStack Router-testkontext med hela root-layouten, oproportionerligt
för en smoke-test given den instabilitet som redan uppmättes i den här
miljön vid flera sekventiella renderingar i samma testfil).

## Resultat

`bun run test` (136 test, upp från 133 - tre nya), `bun run lint`
(0 fel), `bun run typecheck`, `bun run build` - alla gröna.

## Dokumentationspåverkan

Ingen ytterligare dokumentation i den här repon.
