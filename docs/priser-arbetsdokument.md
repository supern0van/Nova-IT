# Priser - arbetsdokument (internt, ej publicerat)

Påbörjat: 2026-08-23

Det här dokumentet är en intern arbetsyta för att ta fram priser och
paketering för Nova IT:s tjänster. Innehållet är **inte** publikt och ska
**inte** visas på nova-it.se förrän bolaget går live - beslutat av Stefan
2026-08-23.

## Syfte

- Sätta realistiska priser per tjänst/tjänstekategori (se `/tjanster` för
  nuvarande tjänsteindelning i koden: `src/features/`/`src/routes/tjanster*`).
- Bestämma om priserna ska visas som fasta priser, från-priser, eller kräva
  offert/kontakt.
- Förbereda så att prissättningen kan läggas till i tjänstekortens
  datamodell utan större omskrivning när den väl ska publiceras.

## Status

- [ ] Lista samtliga nuvarande tjänster med kort beskrivning (utgå från
      tjänstedatan i koden).
- [ ] Sätt ett preliminärt pris/prisintervall per tjänst.
- [ ] Bestäm prismodell: fast pris, från-pris, offertbaserat, eller en
      blandning beroende på tjänst.
- [ ] Bestäm var priser ska visas: tjänstekort, tjänstesida, eller bara i
      kontaktflödet.
- [ ] Juridisk koll: prisuppgifter påverkar konsumenträttsliga krav
      (t.ex. ångerrätt, prisinformation enligt marknadsföringslagen) - ta med
      i `docs/juridisk-granskning-underlag.md` inför granskningen.

## Publiceringsvillkor

Priserna går live först när:

1. Bolaget självt går live (se övriga launch-beslut i `docs/roadmap.md`).
2. Prislistan är godkänd av Stefan.
3. Eventuella juridiska krav på prisinformation är avstämda.

Fram tills dess hålls detta dokument och eventuell prisdata utanför publik
kod/kod-path (dvs. inte i `src/routes` eller andra ställen som renderas på
live-sajten).
