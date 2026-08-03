---
id: NOVA-0017
date: 2026-08-03
type: security
scope: cloudflare
---

## Vad ändrades?

Den publika webbplatsens frame-skydd skärptes till samma grundprincip som
portalerna: sidan får inte bäddas in i andra webbplatser. Projektet fick även
ett scriptat live-test för Cloudflare/DNS/e-post som kan köras inför lansering.

## Varför?

Cloudflare- och DNS-inställningar är delvis dashboardstyrda och kan därför glida
från koden. Ett återkörbart test gör avvikelser synliga, och strikt
frame-skydd minskar klickkapningsytan utan att påverka Turnstile-widgeten.

## Resultat

`bun run audit:cloudflare-live` kontrollerar live-headers, portalernas no-store,
canonical redirects, SPF, DMARC och Resend-DKIM-läget. Testet flaggar avsiktligt
kvarvarande DNS-arbete som behöver göras i Cloudflare/registrar innan slutlig
lansering.
