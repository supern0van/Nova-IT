---
id: NOVA-0029
date: 2026-08-07
date_precision: day
type: changed
status: completed
systems:
  - public-site
---

# Riktig inloggning i portal-dropdownen

## Vad ändrades?

Portal-panelen i sidhuvudet (`src/components/portal-meny.tsx`) visar nu riktiga inloggningsfält - Ärendenummer och Lösenord - i stället för en "Logga in"-knapp som länkade ut till kundportalens egen inloggningssida. Fälten postas som ett vanligt HTML-formulär (`method="POST"`, inget `target`-attribut) direkt till kundportalens `/api/kund/logga-in-form`. "Säker anslutning · Nova IT" är nu en länk till `kundportal.nova-it.se/sakerhet`.

## Varför?

Två problem med den tidigare panelen (NOVA-0028): "Logga in"-länken öppnade en ny flik (`target="_blank"`), och kunden fick logga in på en separat sida i stället för att göra det direkt i headern. Ägaren av produkten krävde att inloggning aldrig ska öppna en ny flik och att en lyckad inloggning ska ta kunden direkt till sin ärende-startsida.

Lösningen bygger på en endpoint som redan fanns förberedd i kundportalens backend för exakt detta syfte (`app/api/kund/logga-in-form/route.ts`, tillagd tillsammans med rate limiting 2026-08-03). Ett formulär-POST kräver ingen CORS, så same-origin-skyddet för kundportalens JSON-API (`verifieraSameOrigin`, se NOVA-0028) berörs inte - lösenordet går aldrig via nova-it.se:s server, bara direkt från kundens webbläsare till kundportalens egen, skyddade origin, som sätter sina egna host-bundna sessionskakor.

## Resultat

Klick på "Logga in" i dropdownen skickar formuläret i samma flik. Lyckad inloggning redirectar (303) till kundportalens `/mina-arenden`, redan autentiserad. Misslyckad inloggning redirectar till kundportalens egen `/logga-in?fel=...` med felmeddelande - fortfarande samma flik, ingen ny.

## Dokumentationspåverkan

Ingen i det här repot. Motsvarande ändring i `Nova-IT-Kundportal` (konsekvent gäst-header + ny `/sakerhet`-sida) dokumenteras i det repots egen changelog.
