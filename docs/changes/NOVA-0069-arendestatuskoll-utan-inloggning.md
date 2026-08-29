---
id: NOVA-0069
date: 2026-08-27
date_precision: day
type: added
status: completed
systems:
  - publik-webbplats
  - adminportal
---

# Ärendestatuskoll utan inloggning

## Vad ändrades?

Ny sida `/arendestatus` där en besökare kan slå upp status på sitt ärende med
ärendenummer + e-postadress (samma uppgifter kunden fick i bekräftelsen när
ärendet skapades), utan att logga in i kundportalen. Bygger på en ny,
server-till-server-brygga mot adminportalen: `src/features/status-check/`
(publika sajten) anropar adminportalens nya `/api/public/arendestatus`
(separat PR, supern0van/Nova-IT-Portaler#156) med en egen, distinkt
hemlighet (`STATUSKOLL_SECRET`) och en egen Turnstile-action (`statuskoll`).
Svaret är whitelistat till statusetikett, kategori, tidsstämplar och
kundsynliga framstegssteg - aldrig kund-id, ansvarig personal eller interna
anteckningar. Fel e-post för ett giltigt ärendenummer ger exakt samma svar
som ett obefintligt ärendenummer.

Länkat från kontaktformulärets bekräftelsevy och från sajtens footer.

## Varför?

Kunden behövde tidigare skapa och komma ihåg ett fullt kundportal-konto bara
för att se om ett ärende är under hantering. En kartläggning av sajtens
befintliga funktioner identifierade det som den starkaste kandidaten bland
flera möjliga nya funktioner - tekniskt självständig, bygger på redan
existerande infrastruktur (ärendet skapas redan automatiskt via
kontaktformuläret), och kräver inget pris-, innehålls- eller
leverantörsbeslut.

## Resultat

Besökare kan kolla ärendestatus direkt, utan konto. Adminportalen har fått
en ny rate-limitad, whitelistad publik läsendpoint med samma
säkerhetsmönster (repetitionsskydd, icke-avslöjande fel) som det befintliga
publika ärendeintaget.

## Dokumentationspåverkan

Ingen ytterligare - se PR-beskrivningarna i respektive repo för fullständig
teknisk detalj.
