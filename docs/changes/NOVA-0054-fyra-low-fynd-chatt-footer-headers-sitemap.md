---
id: NOVA-0054
date: 2026-08-20
date_precision: day
type: fixed
status: completed
systems:
  - publik-webbplats
---

# Fyra Low-fynd: chattens fokusfångst, döda headerregler, fotens tjänstelista, sitemap

## Vad ändrades?

Fyra Low-severity fynd från den breda kodgenomgången av hela hemsidan
(publika siten):

- `src/features/support/SupportBot.tsx` - ärendeguidens chattpanel hade
  `role="dialog"` men varken `aria-modal="true"` eller någon fokusfångst.
  Tab kunde lämna panelen och gå in i resten av sidan bakom den, vilket
  bryter mot dialog/modal-kontraktet för skärmläsare och
  tangentbordsanvändare. Lade till `aria-modal="true"` och en enkel
  Tab/Shift+Tab-fokusfångst i den befintliga `onKeyDown`-hanteraren.
- `public/_headers` - `/robots.txt`, `/sitemap.xml` och
  `/.well-known/security.txt` fick tidigare en full kopia av sidans
  HTML-säkerhetsheaders (CSP, X-Frame-Options, COOP, Referrer-Policy).
  De svaren är rena text-/XML-svar som aldrig renderas som HTML eller
  exekverar skript - reglerna var döda no-ops som kunde vilseleda en
  granskare. Behåller bara det som faktiskt gör något oavsett
  innehållstyp: HSTS och `X-Content-Type-Options: nosniff`.
- `src/components/site-chrome.tsx` - fotens tjänstelista var en egen
  hårdkodad textlista som redan avvikit från de riktiga tjänstetitlarna
  ("IT-support och helpdesk" mot "IT-support", en annan
  bindestrecks-glyf i "Wi‑Fi") och renderades som ren text utan länkar -
  en besökare kunde inte klicka sig vidare till tjänstesidan. Listan
  härleds nu från den kanoniska `services`-listan
  (`src/lib/nova-data.ts`) och renderas som riktiga länkar till
  `/tjanster/$slug`.
- `public/sitemap.xml` - `lastmod` för `/faq`, `/kontakt` och
  `/assistent` var kvar på sina gamla datum trots att de sidorna
  ändrats i den här sessionens tidigare Medium-fynd-omgång (PR med
  NOVA-0053). Uppdaterat till dagens datum.

Ett femte misstänkt fynd (ofullständig fallback-CSP i `src/server.ts`
jämfört med den riktiga CSP:n i `src/routes/__root.tsx`) undersöktes men
kunde inte styrkas - de två policyerna är direktiv-för-direktiv
identiska förutom `script-src`, vilket är en uttryckligt dokumenterad
avsiktlig skillnad (fallback saknar en per-request-nonce). Ingen ändring
gjord där.

## Varför?

Låg svårighetsgrad, men samtliga är verkliga brister: ett
tillgänglighets-/tangentbordsfångst-gap i chatten, döda men
vilseledande headerregler, en fotens tjänstelista som både gett fel
information och förlorat en klickbar navigeringsväg, samt en sitemap
som inte speglade verkliga ändringsdatum.

## Resultat

Inga databasändringar, inga nya miljövariabler. Rent klient-/statisk
innehålls-fix, ingen driftpåverkan. `bun run test`/`lint`/`typecheck`/
`build` gröna.
