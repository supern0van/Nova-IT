---
id: NOVA-0073
date: 2026-09-12
date_precision: day
type: security
status: completed
systems:
  - public-site
---

# Publika säkerhets- och tillgänglighetsfixar

## Vad ändrades?

CSRF-skydd och replay-skydd har hårdats, mobil- och portalnavigering har fått fokusfällor och statiska resurser har fått klickjacking- och MIME-skydd.

## Varför?

Revisionen hittade cross-site-serverfunktionsrisk, återspelningsbara interna anrop och tangentbordsfokus som kunde lämna en öppen meny.

## Resultat

Publika serverfunktioner kräver CSRF-kontroll, interna intagsanrop bär färsk timestamp och nonce, och menyerna håller fokus tills de stängs.

## Dokumentationspåverkan

Ingen.
