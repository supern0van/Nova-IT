# Google Business-profil — checklista (internt)

Skapat: 2026-08-23. Det här är en handoff till Stefan - att skapa/verifiera
profilen är en verksamhetsåtgärd Google kräver av kontoägaren personligen
(inklusive en adressverifiering), det går inte att göra via kod eller av
mig. Checklistan är här så att den görs rätt första gången och matchar
sajten exakt (NAP-konsistens - Name, Address, Phone - är en etablerad
rankingfaktor för lokal SEO).

## Innan du börjar

- **Ingen fysisk besöksadress.** Nova IT har ingen kontorsadress kunder ska
  besöka (se NOVA-0055 - hemadressen är medvetet inte publik). Google
  Business har en kategori för det: **"Service area business"** (tjänste-
  områdesföretag) i stället för en adress som visas publikt. Välj det
  alternativet, inte en vanlig adress-baserad profil - annars riskerar
  hemadressen att bli synlig i Google Maps, vilket motsäger NOVA-0055.
- **Serviceområde**: ange Hässelby, Västerort, Bromma, Järfälla, Jakobsberg,
  Sundbyberg, Solna, Stockholms innerstad - samma lista som redan används i
  `src/lib/structured-data.ts` (`areaServed`). Håll de här listorna
  synkade om ena ändras.

## Uppgifter att fylla i (måste matcha sajten exakt)

| Fält | Värde |
| --- | --- |
| Företagsnamn | Nova IT |
| Kategori | IT-support/datorreparation (välj Googles närmaste matchande kategori) |
| Telefon | 076-225 20 39 (se avvägning nedan) |
| E-post/webbplats | kontakt@nova-it.se / https://nova-it.se |
| Serviceområde | Hässelby, Västerort, Bromma, Järfälla, Jakobsberg, Sundbyberg, Solna, Stockholms innerstad |
| Organisationsform | Enskild firma (Google frågar inte alltid efter detta explicit, men kan behövas vid verifiering) |

**Telefon-avvägningen:** numret är i dagsläget inte publicerat på
live-sajten (se `docs/project-status.md`). En Google Business-profil utan
telefonnummer fungerar sämre - Google prioriterar profiler med telefon, och
många användare förväntar sig att kunna ringa direkt från sökresultatet.
Om profilen ska ha fullt värde bör numret troligen bli publikt i alla fall
via den vägen, även om det dröjer på själva sajten - värt ett eget beslut
innan profilen skapas, inte något jag antar åt dig.

## Verifiering

Google verifierar en ny profil oftast via ett vykort med kod till en
adress, eller ibland telefon/e-post för vissa kategorier. Eftersom Nova IT
är en "service area business" utan publik adress används sannolikt en
adress du ändå måste uppge internt till Google (den behöver inte visas
publikt, bara verifieras) - vykortet skickas dit. Räkna med 1-2 veckors
väntetid på vykortet.

## Efter att profilen är skapad och verifierad

1. Skicka mig profil-URL:en (t.ex. `https://g.page/...` eller
   `maps.app.goo.gl/...`).
2. Jag lägger in den som `sameAs` i `buildLocalBusinessJsonLd()`
   (`src/lib/structured-data.ts`) - kopplar ihop sajtens strukturerade data
   med profilen, vilket stärker båda i sökresultat.
3. Fyll gärna på profilen efter hand med bilder, öppettider (om ni har
   fasta sådana) och - när ni har riktiga kundomdömen - låt kunder lämna
   recensioner där. Det är också underlaget för `AggregateRating`-schema på
   sajten längre fram (se `docs/public-site-grind6-audit.md`, punkt 12) -
   men bara med riktiga recensioner, aldrig påhittade.
