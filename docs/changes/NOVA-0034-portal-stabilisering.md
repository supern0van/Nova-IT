---
id: NOVA-0034
date: 2026-08-09
date_precision: day
type: fixed
status: completed
systems:
  - public-site
  - adminportal
  - kundportal
---

# Stabiliserade portalflöden

## Vad ändrades?

Den publika Portal-inloggningen förenklades, säkerhetslänken togs bort från
loginytan och Turnstile placerades diskret sist. Adminärenden visar ett konkret
nästa steg och utskicksåtgärden redovisar om kundmejlet faktiskt accepterades av
e-postleverantören.

## Varför?

Loginytan innehöll konkurrerande information och gav för svag återkoppling när
inloggningen startade. Admin kunde dessutom visa ett lyckat utskick trots att
Resend hade avvisat mejlet.

## Resultat

Kundens loginflöde är tydligare och admin får korrekt återkoppling om
kundinloggningsmejlet samt ett synligt förslag på nästa arbetssteg.

## Dokumentationspåverkan

Ingen.
