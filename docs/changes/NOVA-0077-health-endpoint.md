---
id: NOVA-0077
date: 2026-09-13
date_precision: day
type: added
status: completed
systems:
  - public-site
---

# `/health`-endpoint för extern övervakning

## Vad ändrades?

- **Ny:** `src/routes/health.ts` (TanStack Start server route, inget UI) +
  `src/features/health/health-check.ts` (testbar kärnlogik). Svarar alltid
  200 med JSON: `{ status: "ok" | "degraderad", kontroller: {...} }`.
- Kontrollerar bara KONFIGURATION - miljövariabler och Cloudflare-
  bindningars NÄRVARO - aldrig ett riktigt anrop mot Turnstile,
  adminportalens intag eller AI-budgeten (ett sådant anrop skulle vara
  kostsamt att polla ofta, kunna trigga PUB-1/PUB-3-hastighetsspärrarna,
  och för AI-budgeten faktiskt förbruka en reservation).
- `status: "degraderad"` sätts bara av kritiska brister (kontaktformuläret
  öppet men okonfigurerat, Turnstile obligatoriskt men saknar hemlighet,
  ärendestatuskollen okonfigurerad). Supportassistentens av/på-läge och
  PUB-1/PUB-3-bindningarna redovisas men styr aldrig toppstatusen - de har
  redan egna fail-open-fallbacker (se DEC-0007).

## Varför?

Ett av förslagen ur den breda granskningen 2026-09-13, byggt efter att
Stefan bekräftat att Cloudflare-övervakning är den avsedda konsumenten.
Ett naivt "processen svarar"-hälsokontroll ger falsk trygghet - Workers
svarar nästan alltid 200 även när en nedströms integration är trasig.

## Resultat

- `bun run test` (178/178, upp från 168), typecheck, lint (0 fel), build
  gröna. Verifierat live mot lokal dev-server.
- En övervakningstjänst kan nu polla `/health` och få tidig varning om
  t.ex. `INTAG_SECRET` eller `STATUSKOLL_SECRET` saknas i produktion,
  i stället för att upptäcka det först när en kund rapporterar att
  formuläret inte fungerar.

## Dokumentationspåverkan

Ingen.
