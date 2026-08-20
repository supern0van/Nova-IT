---
id: NOVA-0055
date: 2026-08-20
date_precision: day
type: changed
status: completed
systems:
  - publik-webbplats
---

# Integritetspolicyn: tydligare org.nr-etikett, hemadress borttagen

## Vad ändrades?

`src/components/legal-dialog.tsx`s integritetspolicy, avsnittet
"Personuppgiftsansvarig":

- Org.nr:et visades tidigare med etiketten "Organisationsnummer" och
  utan förklaring - eftersom Nova IT är en enskild firma sammanfaller
  numret med innehavarens personnummer, och stod därför i praktiken
  utskrivet i personnummerformat på en publik sida. Etiketten är nu
  "Org.nr" och firmaformen anges explicit ("Nova IT (enskild firma)")
  för att göra sammanhanget tydligt för besökaren.
- Hemadressen ("Persikogatan 12, 165 63 Hässelby") är borttagen helt.
  Verksamheten har ingen fysisk besöksadress för kunder - att publicera
  en privatpersons hemadress gav ingen funktionell nytta men en
  onödig integritetsrisk för innehavaren. Kontakt sker via e-post, som
  redan stod kvar i avsnittet.

## Varför?

Strikt beslutsfråga från den breda kodgenomgången, avgjord av Stefan:
etiketten skulle förtydligas och hemadressen tas bort. GDPR/legal kräver
en kontaktväg för personuppgiftsansvarig, inte en fysisk adress - e-post
uppfyller det kravet.

## Resultat

Ingen kodlogik, databas eller drift påverkas - ren textändring i ett
statiskt dialog-innehåll. `bun run test`/`lint`/`typecheck`/`build`
gröna.
