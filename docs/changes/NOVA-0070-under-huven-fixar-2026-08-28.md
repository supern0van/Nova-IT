---
id: NOVA-0070
date: 2026-08-28
date_precision: day
type: changed
status: completed
systems:
  - publik-webbplats
  - adminportal
  - kundportal
  - ai-budget
---

# Under-huven-fixar efter bred verifiering

Den skarpa körningen täckte nätverksgränser, server-till-server-intag,
replay-skydd, kroppsstorlekar, idempotens, atomisk behandling av
ärendeförfrågningar, fail-closed-rate-limits, AI-budget och chattens
klientspärr. Externa fetch-anrop har tidsgränser, publika säkerhetsheaders är
stramare och sitemap/cache-konfigurationen är kompletterad.

AI-budgetens klientspärr använder ett hashat rateKey och lagrar inte rå IP.
Prisunderlag och kundomdömen förblir interna beslutsunderlag; de exponeras inte
av denna ändring.

## Drift före produktion

De tre nya Supabase-migrationerna måste köras i respektive miljö. Migrationen
för normaliserade kundmejl förutsätter att befintliga mejladresser först
kontrolleras för dubbletter; inga poster ska raderas automatiskt.

Efter migrationerna ska produktionshemligheter och Worker-versioner verifieras
och en separat release/deploy- och live-smokekontroll genomföras.
