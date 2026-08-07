---
id: NOVA-0030
date: 2026-08-07
date_precision: day
type: changed
status: completed
systems:
  - public-site
---

# Autofokus i portal-dropdownens inloggningsformulär

## Vad ändrades?

När Portal-panelen i sidhuvudet öppnas (`src/components/portal-meny.tsx`) flyttas tangentbordsfokus nu direkt till Ärendenummer-fältet, i stället för att stanna kvar på Portal-knappen.

## Varför?

Efter NOVA-0029 (riktiga inloggningsfält i panelen) saknades autofokus - tangentbords- och skärmläsaranvändare behövde tabba manuellt från knappen till första fältet varje gång panelen öppnades.

## Resultat

Fokus hamnar direkt i Ärendenummer-fältet vid öppning, på både desktop och mobil. Escape-beteendet (stäng panelen, återställ fokus till knappen) är oförändrat.

## Dokumentationspåverkan

Ingen.
