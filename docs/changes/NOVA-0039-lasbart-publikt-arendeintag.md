---
id: NOVA-0039
date: 2026-08-16
date_precision: day
type: security
status: completed
systems:
  - publik-webbplats
---

# Låsbart publikt ärendeintag inför pentest och juridisk granskning

## Vad ändrades?

Miljövariabeln `PUBLIK_INTAG_LAGE` kan nu låsa det publika ärendeintaget utan
att ta ner webbplatsen. Sätts den till `stangd` avvisas inskickningar
server-side i `skickaKontaktforfragan()`, innan honeypot, tidskontroll och
Turnstile - alltså innan någon kunddata behandlas eller skickas vidare till
adminportalen, Turnstile eller Resend.

Kontaktsidan visar då i stället en tydlig sida som hänvisar till
`kontakt@nova-it.se`. Resten av webbplatsen är opåverkad, inklusive
supportassistenten, som är helt lokal och inte skickar något någonstans förrän
kunden väljer att gå vidare.

Alla värden utom exakt `stangd` - inklusive saknat eller felstavat - betyder
att intaget är öppet, så variabeln kan aldrig tyst stänga av ärendemottagningen.

`.env` och `.env.*` lades till i `.gitignore`. `.env.example` instruerar
uttryckligen att lägga `RESEND_API_KEY`, `INTAG_SECRET` och
`TURNSTILE_SECRET_KEY` i en lokal env-fil, men bara `.dev.vars` var ignorerad -
en lokal `.env` hade alltså kunnat committas med skarpa hemligheter.

## Varför?

Externt penetrationstest och juridisk slutgranskning av kundportalen är
fortfarande inte gjorda (se `docs/roadmap.md`, Milstolpe 5). Supportassistenten
loggar sedan NOVA-0038 kundens faktiska formuleringar i ärendet i stället för
att de försvinner med webbläsarsessionen, vilket gör att skarp trafik innebär
verklig persondatabehandling.

Låset gör att webbplatsen kan ligga uppe publikt medan mottagningen aktiveras
först när granskningarna är gjorda, i stället för att behöva välja mellan att
ta ner sidan eller ta emot skarpa personuppgifter i förtid.

## Resultat

Ärendeintaget kan stängas och öppnas med en miljövariabel på Workern, utan
kodändring och utan driftstopp. Ett stängt intag håller även om
serverfunktionen anropas direkt, eftersom kontrollen inte ligger i
gränssnittet. Lokala hemligheter kan inte längre committas via en `.env`-fil.

## Dokumentationspåverkan

`.env.example` dokumenterar den nya variabeln. Ingen ytterligare uppdatering
behövs.
