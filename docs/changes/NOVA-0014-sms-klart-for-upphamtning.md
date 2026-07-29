---
id: NOVA-0014
date: 2026-07-29
date_precision: day
type: added
status: completed
systems:
  - Adminportal
  - Cloudflare Workers
---

# SMS till kund: "klart för upphämtning"

## Vad ändrades?

Adminportalens ärendedetaljsida fick en ny knapp ("SMS: klart för upphämtning") som
skickar ett SMS till kunden om att ärendet är klart och produkten kan hämtas. Bygger
mot 46elks REST-API (`lib/admin/sms-server.ts`), gated bakom samma `svara_kund`-behörighet
som all annan kundkommunikation i portalen. Utskicket loggas som en ny aktivitetstyp
(`sms`) i ärendets tidslinje. `ELKS_API_USERNAME`/`ELKS_API_PASSWORD`/`SMS_AVSANDARE` är
valfria Worker-secrets - soft-fail-designat precis som Turnstile på den publika sajten:
saknas de visas ett tydligt fel när knappen används, men resten av portalen fungerar
oförändrat.

## Varför?

Ett återkommande manuellt steg (ringa eller sms:a kunden när en reparation/beställning
är klar) automatiserades till en enda knapptryckning, oberoende av den planerade
kundportalen (som kräver egen inloggning/kontohantering och inte är byggd än). Telefonnummer
fanns redan validerade i datamodellen (`admin_arenden.telefon`), så funktionen krävde ingen
ny datainsamling.

## Resultat

En administratör eller tekniker kan med en bekräftelsedialog skicka ett SMS till kunden
direkt från ärendedetaljsidan. Numret normaliseras automatiskt från valfritt svenskt
format (t.ex. "070-448 58 78") till det internationella format 46elks kräver.

## Dokumentationspåverkan

`docs/deployment.md` har körordern för att skapa ett 46elks-konto och sätta de tre
valfria Worker-secrets.
