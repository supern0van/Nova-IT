---
id: NOVA-0079
date: 2026-10-03
date_precision: day
type: changed
status: completed
systems:
  - public-site
---

# Ta bort Stockholms innerstad ur kärnområdet

## Vad ändrades?

- `src/lib/service-region.ts`: "Stockholms innerstad" plockades bort från
  `shortLabel`, `title` och `description`. `practicalNote` nämner nu
  innerstaden explicit som en del av det den redan sa gällde individuell
  bedömning: "Förfrågningar från andra delar av Stockholm, inklusive
  innerstaden, bedöms individuellt."
- `src/lib/structured-data.ts`: "Stockholms innerstad" borttaget ur
  `areaServed` (strukturerad data för LocalBusiness/Service).
- Sidtitlar, meta-description och og:title/description på `/`, `/tjanster`,
  `/privatpersoner` och `/foretag-foreningar` uppdaterade i samma riktning
  - de hade egna hårdkodade strängar, inte `serviceRegion`.

## Varför?

Stockholms innerstad ligger geografiskt för långt från de övriga redan
namngivna orterna (Hässelby, Västerort, Bromma, Järfälla/Jakobsberg,
Sundbyberg, Solna), som alla ligger samlade i nordvästra Stockholm. Att
nämna innerstaden som kärnområde gav en bredare och mindre trovärdig
profil än vad en Hässelby-baserad verksamhet rimligen levererar på.

## Resultat

- Kärnområdet är nu konsekvent nordvästra Stockholm (Hässelby, Västerort,
  Bromma, Järfälla, Jakobsberg, Sundbyberg, Solna).
- Innerstaden är inte borttagen helt - förfrågningar därifrån bedöms
  fortfarande, men som en explicit del av "bedöms individuellt"-texten
  i stället för att listas som kärnområde.
- `bun run typecheck`, `bun run lint` (0 fel) och `bun run test`
  (190 pass) gröna. Verifierat med `bun run build` att ingen kvarvarande
  "Stockholms innerstad"-sträng följer med i byggd output.

## Dokumentationspåverkan

Ingen.
