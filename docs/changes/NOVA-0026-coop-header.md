---
id: NOVA-0026
date: 2026-08-03
date_precision: day
type: security
status: completed
systems:
  - public-site
---

# Cross-Origin-Opener-Policy på publika sajten

## Vad ändrades?

Lade till `Cross-Origin-Opener-Policy: same-origin` bland de befintliga säkerhetsheadrarna i `src/server.ts` och i `public/_headers` (för `/robots.txt`, `/sitemap.xml` och `/.well-known/security.txt`).

## Varför?

En riskbedömd genomgång av CSP och säkerhetsheaders inför skarp drift identifierade COOP som en headers som saknades men som är lågrisk att lägga till: den isolerar sidans renderingsprocess mot cross-origin-fönster. Koden har ingen `window.open`/`window.opener`/`postMessage`-användning som skulle kunna påverkas, och headern är trivial att ta bort om något oväntat skulle strula.

Två andra kandidater utreddes men implementerades medvetet **inte** i denna omgång:

- `script-src` utan `unsafe-inline`: redan dokumenterat i `src/server.ts` att TanStack Start serialiserar hydreringsstate som inline-scripts i SSR-svaret. Utan `unsafe-inline` kraschar klienthydreringen. Kräver nonce-stöd i TanStack Starts server-rendering, vilket är ett ramverksspår, inte en headerjustering.
- HSTS `preload`: skickar domänen till webbläsarnas hårdkodade preload-lista, vilket är svårt att ångra på kort tid. Kräver ett uttryckligt, medvetet beslut om långsiktig domänstrategi och gjordes inte utan det.

## Resultat

Publika sajten svarar nu med `Cross-Origin-Opener-Policy: same-origin` på både SSR-sidor och statiska filer.

## Dokumentationspåverkan

Ingen.
