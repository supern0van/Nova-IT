---
id: NOVA-0031
date: 2026-08-08
date_precision: day
type: security
status: completed
systems:
  - public-site
---

# Turnstile på portal-dropdownens inloggningsformulär

## Vad ändrades?

`portal-meny.tsx` laddar nu Cloudflare Turnstile och renderar widgeten i inloggningsformuläret (bara medan panelen är öppen). `TurnstileWidget` (delad med kontaktformuläret) fick en ny obligatorisk `action`-prop så de två användningarna kan skiljas åt server-side.

## Varför?

Formuläret postar till kundportalens `/api/kund/logga-in-form`, som tidigare enbart hade rate limiting - ingen Turnstile. Motiveringen bakom det (panelen var en låst Figma-export utan utrymme för en widget) gäller inte längre efter NOVA-0029/NOVA-0030. Se motsvarande ändring i Nova-IT-Kundportal (`lib/turnstile-server.ts`, `app/api/kund/logga-in-form/route.ts`).

Återanvänder den befintliga "Nova IT kontaktformulär"-widgeten (redan vitlistad för nova-it.se på Cloudflare-sidan) i stället för att skapa en ny.

## Resultat

Inloggning via headerpanelen har nu samma Turnstile-skydd som kundportalens egen `/logga-in`-sida, utöver den redan befintliga rate limitingen. Ingen förändring i hur panelen ser ut eller beter sig visuellt - widgeten är i "managed"-läge och syns normalt inte.

## Dokumentationspåverkan

Ingen.
