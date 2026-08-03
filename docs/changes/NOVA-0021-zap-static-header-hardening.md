---
id: NOVA-0021
date: 2026-08-03
type: security
scope: public-site
---

## Vad ändrades?

Webbplatsen fick en statisk `_headers`-konfiguration för `/robots.txt` och
`/sitemap.xml`, med defensiva headers för MIME-sniffning, inramning,
referrer-policy och CSP. Live-auditen för Cloudflare utökades så den även
kontrollerar metadatafilerna för `X-Content-Type-Options`, `X-Frame-Options`
och `frame-ancestors`.

## Varför?

ZAP by Checkmarx rapporterade att `robots.txt` och `sitemap.xml` saknade vissa
säkerhetsheaders. De filerna levereras som statiska filer och passerar inte
alltid webbplatsens SSR-wrapper i `src/server.ts`.

## Resultat

Efter deploy ska ZAP-fynden för saknade headers på metadatafilerna vara
åtgärdade. `bun run audit:cloudflare-live` ska samtidigt börja fånga om samma
klass av regressionsfel återkommer.
