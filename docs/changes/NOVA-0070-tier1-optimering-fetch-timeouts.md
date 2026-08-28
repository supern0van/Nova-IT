---
id: NOVA-0070
date: 2026-08-28
date_precision: day
type: infrastructure
status: completed
systems:
  - publik-webbplats
---

# Konsekventa fetch-timeouts + parallella Resend-anrop i kontaktflödet

## Vad ändrades?

- `contact-server.ts`: fem `fetch`-anrop (ärendeintag mot adminportalen,
  Turnstile-verifiering, intern avisering, kundbekräftelse,
  bekräftelsestatus-uppdatering) fick `signal: AbortSignal.timeout(8000)`
  - samma mönster som redan finns och fungerar i `case-status-server.ts`.
- `portal-turnstile-server.ts`: samma timeout på anropet mot kundportalens
  `/api/public/turnstile-config`.
- `skickaKontaktforfragan`: de två oberoende Resend-anropen (intern
  avisering + kundbekräftelse) körs nu parallellt via `Promise.all` i
  stället för sekventiellt.

## Varför?

Del av en djup optimeringsanalys av hela Nova IT-ekosystemet (kodblock
för kodblock, 8 granskningslinser). Dessa fetch-anrop saknade det
timeout-mönster som redan var etablerat och testat i `case-status-
server.ts` - en inkonsekvent tillämpning, inte en ny idé. Utan en
timeout kan ett hängande anrop mot Resend/Turnstile/adminportalen hålla
en Worker-request öppen obegränsat länge i stället för att felas ärligt
efter en rimlig tid. De två Resend-anropen har inget inbördes beroende
och körde sekventiellt utan anledning.

## Resultat

Begränsar värsta scenariot per kontaktinskick från "hur länge motparten
tar" till 8 sekunder per hopp. Halverar den delen av svarstiden för
kontaktformuläret som går åt till de två Resend-anropen. Inget externt
kontrakt ändras - samma svar, samma felhantering, bara snabbare/mer
förutsägbart vid en långsam eller hängande motpart.

`bun test`: 154/155 gröna (den enda avvikande raden är ett
förhandsbefintligt Playwright-relaterat e2e-plockningsstrul i `bun test`,
bekräftat identiskt utan dessa ändringar). `bun run typecheck` och
`eslint` rena. `bun run build` lyckas oförändrat.

## Dokumentationspåverkan

Ingen ytterligare dokumentation i den här repon.
