---
id: NOVA-0046
date: 2026-08-16
date_precision: day
type: infrastructure
status: completed
systems:
  - publik-webbplats
---

# Koppla supportassistenten till den delade AI-budgeten

## Vad ändrades?

`support-ai-server.ts` kontrollerar nu en delad budget - en ny Cloudflare
Worker, `nova-it-ai-budget` (Nova-IT-Portaler-repot) - innan den ens frågar
efter sin egen `AI`-bindning. Kopplingen sker via en Service Binding,
`AI_BUDGET_SERVICE`, tillagd i `vite.config.ts` bredvid den befintliga
`ai`-bindningen.

## Varför?

nova-it.se, adminportal och kundportal är tre separata Workers med separat
AI-konfiguration. Utan en gemensam bokföring kunde de tillsammans överskrida
Cloudflare Workers AI:s dagskvot utan att något enskilt system märkte det.
Den nya `ai-budget`-Workern håller en atomisk, gemensam räknare (Durable
Object, inte KV - se
`Nova-IT-Portaler/docs/portal-lyft/2026-08-16-delad-ai-budget.md` för det
fullständiga resonemanget) som alla tre system frågar innan de gör ett
AI-anrop.

Kontrollen är medvetet **fail closed**: om budget-Workern inte går att nå
antas budgeten vara slut och AI-anropet görs aldrig. Det är motsatt princip
mot resten av supportassistentens felhantering (som faller tillbaka till den
regelbaserade motorn vid AI-fel) - men här är hela poängen att aldrig riskera
att gå över en delad kvot.

## Resultat

- Ny `harAiBudget()` i `support-ai-server.ts`, samma dynamiska
  importmönster som den befintliga `hamtaAiBindning()` (`getRequest()` från
  `@tanstack/react-start/server`, importerad inuti en `createServerOnlyFn`
  för att inte trigga `importProtection`).
- 2 nya tester för budgetnekande (nekad reservation, onåbar tjänst) - båda
  verifierar att `fetch` aldrig anropas när budgeten säger nej.
- 95 tester totalt, typecheck och lint rena, byggt `wrangler.json` innehåller
  både `ai`- och `services`-bindningen.
- Ingen hemlighet tillkommer - Service Bindings autentiseras av Cloudflare
  internt.

## Dokumentationspåverkan

`Nova-IT-Portaler/docs/portal-lyft/2026-08-16-delad-ai-budget.md` beskriver
hela systemet (alla tre konsumenter, DO-arkitekturen, gränserna).
