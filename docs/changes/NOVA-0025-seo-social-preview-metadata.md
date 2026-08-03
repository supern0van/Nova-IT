---
id: NOVA-0025
date: 2026-08-03
date_precision: day
type: fixed
status: completed
systems:
  - public-site
---

# Saknad delningsmetadata på tre publika sidor

## Vad ändrades?

`arbetssatt`, `assistent` och `projekt-aterbruk` fick `og:image` samt `twitter:title`, `twitter:description` och `twitter:image` i sin `head()`-metadata. Standardvyn av `/kontakt` (utan `?form=request`) fick samma `BreadcrumbList`-JSON-LD som redan fanns i formulärvyn.

## Varför?

En teknisk synlighets- och SEO-genomgång inför att Nova IT går från prototyp till skarp verksamhet visade att de tre sidorna saknade egna delningstaggar och därför föll tillbaka på startsidans generiska bild och titel vid delning i sociala kanaler och chattappar. Standard-`/kontakt` – den vy som besökare och sökmotorer faktiskt möter – saknade brödsmulor i strukturerad data trots att koden för det redan fanns i en annan gren av samma komponent.

## Resultat

Delning av `/arbetssatt`, `/assistent` och `/projekt-aterbruk` visar nu sidans egen titel, beskrivning och bild i stället för startsidans. `/kontakt` har korrekt `BreadcrumbList`-schema oavsett vilken vy av sidan som renderas.

## Dokumentationspåverkan

Ingen.
