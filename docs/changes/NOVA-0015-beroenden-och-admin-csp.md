---
id: NOVA-0015
date: 2026-08-02
date_precision: day
type: security
status: completed
systems:
  - public-site
  - adminportal
---

# Hårdade beroenden och nonce-baserad CSP

## Vad ändrades?

Sårbara transienta beroenden låstes till korrigerade versioner där kompatibla
uppdateringar fanns. Adminportalens tidigare blockerande Content Security Policy
ersattes med en unik nonce per svar och dynamisk rendering enligt Next.js modell.

## Varför?

Beroendeskedjan innehöll kända sårbarheter och den tidigare policyn blockerade
Next.js egna startskript, vilket gav en tom adminportal i produktion.

## Resultat

Publika webbplatsens och adminportalens verifieringar passerar. Adminportalens
inline-startskript tillåts endast med den unika nonce som hör till svaret, medan
generell `unsafe-inline` fortfarande saknas i `script-src`.

## Dokumentationspåverkan

Ingen.
