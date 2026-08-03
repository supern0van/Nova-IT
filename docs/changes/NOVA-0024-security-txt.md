---
id: NOVA-0024
date: 2026-08-03
date_precision: day
type: security
status: completed
systems:
  - public-site
---

# Security.txt för ansvarsfull rapportering

## Vad ändrades?

Nova IT publicerar nu `/.well-known/security.txt` med teknisk kontakt,
giltighetstid, föredragna språk och canonical URL.

## Varför?

Cloudflare flaggar saknad `security.txt` som en säkerhetsrekommendation. Filen
ger säkerhetsforskare och besökare en förutsägbar rapporteringsväg utan att
exponera adminportalen eller kundportalen.

## Resultat

Säkerhetsrapporter hänvisas till `webmaster@nova-it.se`,
`admin@nova-it.se` och `support@nova-it.se`. Filen får samma restriktiva
statiska headers som `robots.txt` och `sitemap.xml`.

## Dokumentationspåverkan

Ingen.
