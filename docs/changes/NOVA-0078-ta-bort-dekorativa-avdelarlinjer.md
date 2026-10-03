---
id: NOVA-0078
date: 2026-09-30
date_precision: day
type: changed
status: completed
systems:
  - public-site
---

# Ta bort dekorativa avdelarlinjer på hela sajten

## Vad ändrades?

`border-t` / `border-b` / `border-y` / `divide-y`-linjer som enbart användes
för att visuellt dela av sektioner och listor har tagits bort på hela
nova-it.se: Tjänster (områden, tjänstekatalog, Projekt Återbruk-panelen),
header/footer, Så arbetar vi, Om oss, Projekt Återbruk, FAQ, startsidan,
Kontakt och Ärendestatus. Aktivt tillstånd på mobilnavens länkar (den
blå understrykningen) behölls genom att basera den på en transparent
border istället för att tas bort helt.

## Varför?

Linjerna upplevdes som ett onödigt, lite amatörmässigt visuellt brus i
designen. De fyllde ingen funktionell roll på den publika sajten (till
skillnad från motsvarande radavdelare i adminportalens täta datalistor,
som lämnades orörda).

## Resultat

Sidorna har samma innehåll och struktur men utan de tunna vita/blå
linjerna mellan sektioner och listrader. Verifierat visuellt sida för
sida i dev-servern.

## Dokumentationspåverkan

Ingen.
