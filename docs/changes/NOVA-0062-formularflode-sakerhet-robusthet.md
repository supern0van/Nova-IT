---
id: NOVA-0062
date: 2026-08-24
date_precision: day
type: security
status: completed
systems:
  - publik-webbplats
---

# Säkerhet & robusthet i formulärflödet (Fas P1)

## Vad ändrades?

Tre låg-risk, self-contained fixar från en bred kodgranskning av hela
sajten:

- `JsonLd`-komponenten (`src/components/json-ld.tsx`) escaperar nu
  `</script>`-sekvenser i det serialiserade innehållet innan det skrivs
  via `dangerouslySetInnerHTML`.
- Honeypot-fältet i kontaktformuläret (`src/routes/kontakt.tsx`) har nu
  `aria-hidden="true"` direkt på input/label, inte bara på det
  omgivande `<div>`.
- `composeContactMessage` (`src/features/contact/contact-submission.ts`)
  lägger till en synlig "… (fortsättning klippt)"-markör när kundens
  sammansatta meddelande faktiskt behöver klippas för att rymmas inom
  adminportalens 2000-teckensgräns.

`test`-scriptet i `package.json` utökat till att även köra
`src/components` (var bara `src/features`).

## Varför?

`JsonLd`-escapningen stänger en latent XSS-fälla för nästa dynamiska
datakälla (allt nuvarande innehåll är statiskt, så inget aktivt hål
fanns). Honeypot-fixen minskar risken att en lösenordshanterares
autofyll-heuristik råkar fylla i och trigga spärren för en legitim
besökare. Trunkeringsmarkören förhindrar att ett internt ärende ser ut
som ett trasigt, avbrutet meddelande i stället för en medveten kortning.

## Resultat

Alla tre åtgärdade och testade. `bun run test` (139 test, inkl. tre nya
för `json-ld.tsx` och tre nya för trunkeringsmarkören), `bun run lint`
(0 fel), `bun run typecheck`, `bun run build` - alla gröna.

## Dokumentationspåverkan

Ingen ytterligare dokumentation i den här repon.
