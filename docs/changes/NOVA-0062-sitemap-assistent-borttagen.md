---
id: NOVA-0062
date: 2026-08-23
date_precision: day
type: fixed
status: completed
systems:
  - public-site
  - seo
---

# `/assistent` borttagen ur sitemap.xml under offline-läget

## Vad ändrades?

`public/sitemap.xml` listade `https://nova-it.se/assistent` trots att sidan
sedan NOVA-0061 (2026-08-21) sätter `noindex, follow` via robots-metataggen
när `SUPPORT_ASSISTANT_IS_ONLINE` är `false`. URL:en är borttagen ur
sitemapen tills assistenten är tillbaka i drift.

## Varför?

En sitemap som listar en noindexad sida är en motsägande signal till
sökmotorer - sitemapen säger "indexera mig", robots-taggen säger tvärtom.
Upptäckt vid en genomgång av SEO-läget efter att assistenten sattes offline.

## Resultat

Sitemapen är nu konsekvent med sidans faktiska robots-status. `/assistent`
ska läggas tillbaka i sitemapen samtidigt som `SUPPORT_ASSISTANT_IS_ONLINE`
sätts till `true` igen.

## Dokumentationspåverkan

Ingen.
