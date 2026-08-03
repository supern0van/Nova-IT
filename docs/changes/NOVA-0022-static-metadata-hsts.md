---
id: NOVA-0022
date: 2026-08-03
type: security
scope: public-site
---

## Vad ändrades?

De statiska header-reglerna för `/robots.txt` och `/sitemap.xml` kompletterades
med `Strict-Transport-Security`.

## Varför?

Efter ZAP-uppföljningen utökades live-auditen till att kontrollera metadatafiler
på samma sätt som övriga publika HTTP-responser. Då behöver metadatafilerna ha
samma HSTS-nivå som resten av webbplatsen.

## Resultat

Metadatafilerna får samma transportskydd som övriga publika sidor efter deploy,
och den automatiska live-auditen kan larma om headern försvinner igen.
