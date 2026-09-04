---
id: NOVA-0069
date: 2026-08-27
date_precision: day
type: added
status: completed
systems:
  - publik-webbplats
---

# Ärendestatus utan inloggning (/arendestatus)

## Vad ändrades?

- Ny sida `/arendestatus` - "Följ ditt ärende". Kunden anger ärendenummer +
  e-post (samma två uppgifter som redan finns i bekräftelsemejlet från
  `/kontakt`) och Turnstile, ingen kundportalsinloggning krävs.
- `src/features/case-status/case-status-server.ts` - serverfunktionen
  `lookupCaseStatus`. Verifierar Turnstile med en egen `action`
  ("arendestatus") och anropar adminportalens `/api/public/arendestatus`
  server-till-server med en egen, distinkt delad hemlighet
  (`STATUSKOLL_SECRET`, återanvänder `ADMIN_INTAKE_URL`). Vidarebefordrar
  besökarens riktiga IP (`cf-connecting-ip` på requesten som når nova-it.se)
  som `x-forwarded-for` - annars ser adminportalens per-IP-spärr bara
  nova-it.se:s egen utgående Cloudflare-anslutning, delad av alla besökare.
- `src/features/case-status/case-status-labels.ts` - svenska
  status-/kategorietiketter och vägledningstexter, medvetet en liten
  dubblering av kundportalens `lib/arende-status.ts`/`lib/kategori.ts` (samma
  princip som adminportalens egen kopia) - så att samma ärende beskrivs med
  samma ord oavsett vilken produkt kunden råkar vara i.
- Länkad från sidfotens "Information"-kolumn och från portalpanelen i
  sidhuvudet ("Bara kolla ärendestatus?").
- `.env.example` dokumenterar `STATUSKOLL_SECRET`.
- 12 nya tester (`case-status-server.test.ts`, `case-status-labels.test.ts`).

Adminportalens sida av funktionen (`/api/public/arendestatus`,
`STATUSKOLL_SECRET`, rate limiting per e-post/IP) mergades separat i
Nova-IT-Portaler, PR #156, innan den här PR:n.

## Varför?

Att se "är ni på väg?" på ett redan skickat ärende krävde tidigare ett fullt
kundportalskonto (Supabase-inloggning) - onödigt tungt för en fråga som bara
behöver ärendenummer + e-post för att svaras säkert. En lättviktig, publik
statuskoll sänker tröskeln och minskar antalet "hur går det med mitt
ärende?"-mejl/samtal, utan att avslöja mer än de whitelistade fält
adminportalen redan bestämt (aldrig kund-id, prioritet, ansvarig eller
konversationen).

## Resultat

En besökare som bara vill veta ärendets status behöver inte längre skapa
eller minnas ett kundportalslösenord - `/arendestatus` räcker. Fel e-post
för ett giltigt ärendenummer och ett obefintligt ärendenummer ger identiskt
svar, så sidan går inte att använda för att gissa sig till existerande
ärendenummer eller e-postadresser.

## Dokumentationspåverkan

Ingen. Adminportalens sida av funktionen dokumenterades redan i sitt eget
changelog vid PR #156.
