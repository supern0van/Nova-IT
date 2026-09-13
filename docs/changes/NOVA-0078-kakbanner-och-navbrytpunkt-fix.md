---
id: NOVA-0078
date: 2026-09-13
date_precision: day
type: fixed
status: completed
systems:
  - public-site
---

# Kakbanner blockerade hero-CTA + header klipptes vid 1024-1099px

## Vad ändrades?

- **`src/components/cookie-consent.tsx`:** Kakbannern går från ett fast,
  vänsterförankrat kort (`fixed inset-x-4 bottom-4`, upp till ~280px högt)
  till en smal, sidbred rad längst ned (`fixed inset-x-0 bottom-0`,
  ~70-90px hög) byggd med samma `Container` som resten av sajten.
  Fokushanteringen flyttas från en rubrik (som togs bort) till sektionen
  själv, och `aria-label` ersätter `aria-labelledby`.
- **`src/components/site-chrome.tsx`:** Sidhuvudets brytpunkt för att växla
  mellan mobilmeny och fullständig skrivbordsnavigering flyttas från
  Tailwinds `lg` (1024px) till `xl` (1280px).

## Varför?

Bred layoutgranskning av startsidan (skärmdumpar vid mobil, 1024/1150/
1280/1920px) hittade två konkreta buggar:

1. Det gamla kakkortet täckte hero-rubriken och båda primära
   CTA-knapparna ("Beskriv ärende" / "Se tjänster") på både mobil och
   desktop vid första besöket, tills besökaren aktivt stängde det.
2. Navigeringen bytte till skrivbordsläget redan vid 1024px men fick
   inte plats där - sidan fick 48px horisontell overflow, "Portal"-
   knappen klipptes av och logotypens undertext radbröts till tre
   rader.

## Resultat

- Kakbannern håller sig under CTA-knapparna på både mobil och desktop;
  cookiepolicyn är fortfarande en klickbar länk i raden.
- Ingen horisontell overflow längre, verifierat 320-1920px brett
  (inklusive 1024, 1150, 1279 och 1280px). Mobilmenyn (redan
  tillgänglighetstestad) täcker nu 1024-1279px.
- `bun test` (178/178), `bun run lint` och `bun run typecheck` gröna,
  inga nya varningar.

## Dokumentationspåverkan

Ingen.
