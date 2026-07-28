---
id: NOVA-0012
date: 2026-07-28
date_precision: day
type: infrastructure
status: completed
systems:
  - Cloudflare Workers
  - GitHub Actions
  - Adminportal
---

# Adminportalens Worker-verifiering stärktes

## Vad ändrades?

Adminportalen verifieras nu som en separat Cloudflare Worker i både lokal process och GitHub Actions. CI har ett eget adminportaljobb för `portal/`, bygger den faktiska OpenNext Worker-bundlen och root-projektets Bun-lint ignorerar portalens separata Next/pnpm-app.

Ett nytt kommando, `pnpm smoke:worker`, lades till för att kontrollera live-domänerna och de fail-closed API-svaren efter deploy.

## Varför?

Adminportalen publiceras separat från den publika webbplatsen och behöver därför egna verifieringar. Tidigare blandade root-CI ihop Bun/Vite-projektets lint-regler med portalens Next-projekt, vilket gav återkommande GitHub Actions-fel trots att adminportalens egna verifieringar var gröna.

## Resultat

GitHub Actions verifierar nu både den publika frontendens Bun-kedja och adminportalens pnpm/OpenNext-kedja. Det finns dessutom ett repokommando för att snabbt bekräfta att admin- och portal-domänerna svarar och att skyddade admin-API:er nekar oinloggad trafik.

## Dokumentationspåverkan

`docs/deployment.md` beskriver adminportalens Worker, domäner, verifieringskommandon, obligatoriska secrets och varför `portal/middleware.ts` ska behållas tills OpenNext stöder Next.js 16:s root-`proxy.ts`.
