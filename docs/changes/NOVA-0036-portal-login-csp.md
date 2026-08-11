---
id: NOVA-0036
date: 2026-08-11
date_precision: day
type: fixed
status: completed
systems:
  - nova-it-web
  - kundportal
---

# Portalmenyns inloggningsöverlämning

## Vad ändrades?

Webbplatsens CSP tillåter nu den specifika formulärposten till
`https://kundportal.nova-it.se`. Portalmenyn stoppar dessutom inskickning med
ett tydligt felmeddelande tills Turnstile har lämnat en giltig token.

## Varför?

Den tidigare policyn `form-action 'self'` blockerade den avsedda överlämningen
till kundportalen efter att knappen redan hade gått över i laddningsläge. För
användaren såg det därför ut som en inloggning som aldrig blev klar.

## Resultat

Portalmenyn kan lämna över inloggningen till kundportalens avgränsade endpoint,
och en ofärdig säkerhetskontroll kan inte längre orsaka en tyst laddningscirkel.

## Dokumentationspåverkan

Ingen.
