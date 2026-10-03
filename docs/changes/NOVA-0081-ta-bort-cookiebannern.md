---
id: NOVA-0081
date: 2026-10-03
date_precision: day
type: removed
status: completed
systems:
  - public-site
---

# Ta bort den automatiska kakbannern

## Vad ändrades?

Den vita informationsrutan om kakor som dök upp längst ned på varje sida
vid första besöket (`src/components/cookie-consent.tsx`, `<CookieConsent />`
i `src/routes/__root.tsx`) är borttagen, liksom footer-knappen
"Information om kakor" som öppnade den igen (`CookiePreferencesButton` i
`src/components/site-chrome.tsx`). Footerlänken "Kakor" finns kvar och
öppnar fortfarande den fullständiga kakpolicytexten
(`LegalDialogTrigger document="cookies"`, se `legal-dialog.tsx`) — bara
den självutlösande popup-rutan och dess återöppningsknapp är borta.

## Varför?

Enligt NOVA-0067 använder sajten inga kakor som kräver samtycke enligt
IMY:s vägledning (Cloudflare Web Analytics är kakolöst). Bannern var en
frivillig transparensnotis, inte ett juridiskt krav, och upplevdes som
visuellt brus som täckte innehåll. Kakpolicytexten finns kvar och är
fortsatt lätt åtkomlig via footerlänken "Kakor".

## Resultat

`bun run typecheck`/`lint`/`test` (190 test, oförändrat antal) gröna.
E2E-tillgänglighetstestet (`e2e/tillganglighet.spec.ts`) uppdaterat -
kommentaren om att medvetet lämna bannern obesvarad är borttagen eftersom
den inte längre finns.

## Dokumentationspåverkan

Ingen ytterligare dokumentation i den här repon. Historiska changelog-
fragment (NOVA-0067, NOVA-0074) som nämner bannern lämnas oförändrade då
de är tidspunktsbundna poster.
