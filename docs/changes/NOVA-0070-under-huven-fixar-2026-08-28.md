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

## Vad ändrades?

En bred verifieringsrunda över publika sajten, adminportal, kundportal och
ai-budget: nätverksgränser, server-till-server-intag, replay-skydd,
kroppsstorlekar, idempotens, atomisk behandling av ärendeförfrågningar,
fail-closed-rate-limits samt chattens klientspärr. Externa fetch-anrop har nu
tidsgränser (ny delad `fetchWithTimeout`-hjälp, `src/lib/fetch-timeout.ts`),
publika säkerhetsheaders är stramare och sitemap/cache-konfigurationen är
kompletterad.

AI-budgetens klientspärr använder ett hashat rateKey och lagrar inte rå IP.
Prisunderlag och kundomdömen förblir interna beslutsunderlag; de exponeras
inte av denna ändring.

## Varför?

En systemrevision identifierade flera platser där externa anrop saknade
tidsgränser, där kapplöpningar kunde uppstå vid samtidiga anrop, och där
publika endpoints saknade konsekvent fail-closed-beteende vid fel. Att
åtgärda dem i en samlad, bred körning gav möjlighet att verifiera
helheten i stället för att fixa punktvis.

## Resultat

Externa fetch-anrop time:ar ut i stället för att hänga en Worker-request
öppen. Samtidiga anrop mot ärendeförfrågningar och AI-budgeten kan inte
längre skapa dubbletter eller överskrida gränser. Publika säkerhetsheaders
och sitemap/cache-konfiguration är kompletta.

### Drift före produktion

De tre nya Supabase-migrationerna måste köras i respektive miljö. Migrationen
för normaliserade kundmejl förutsätter att befintliga mejladresser först
kontrolleras för dubbletter; inga poster ska raderas automatiskt.

Efter migrationerna ska produktionshemligheter och Worker-versioner verifieras
och en separat release/deploy- och live-smokekontroll genomföras.

## Dokumentationspåverkan

Ingen ytterligare.
