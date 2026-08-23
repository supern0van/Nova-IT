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

- [x] Lista samtliga nuvarande tjänster med kort beskrivning (utgå från
      tjänstedatan i koden).
- [x] Marknadsresearch: jämförelsepriser för svensk IT-support 2026 (se nedan).
- [ ] Stefan sätter faktiskt pris/prisintervall per tjänst utifrån underlaget.
- [ ] Bestäm prismodell: fast pris, från-pris, offertbaserat, eller en
      blandning beroende på tjänst.
- [ ] Bestäm var priser ska visas: tjänstekort, tjänstesida, eller bara i
      kontaktflödet.
- [ ] Juridisk koll: prisuppgifter påverkar konsumenträttsliga krav
      (t.ex. ångerrätt, prisinformation enligt marknadsföringslagen) - ta med
      i `docs/juridisk-granskning-underlag.md` inför granskningen.

## Marknadsresearch 2026 (webbsökning 2026-08-23)

Källor längst ner. Siffrorna är vad andra svenska aktörer tar - inte vad
Nova IT ska ta, men ett realistiskt intervall att positionera sig inom.

### Privatpersoner (RUT-berättigat vid arbete i hemmet)

- Ordinarie timpris innan RUT: **700-1 200 kr/h** är normalt spann för
  datorhjälp/IT-support hos etablerade aktörer i Stockholmsområdet.
  Enstaka billigare aktörer ligger runt 595-895 kr/h.
- Efter 50 % RUT-avdrag hamnar kundens *faktiska* kostnad på ungefär
  **350-600 kr/h** - det är det pris kunden upplever, även om fakturan visar
  det högre beloppet innan avdrag.
- RUT gäller installation, reparation och underhåll av dator/IT-utrustning
  i **kundens bostad** - inte fjärrsupport eller arbete på annan plats.
  Fjärrsupport (utan RUT) verkar ligga något lägre, runt 680 kr/h hos en
  jämförd aktör.
- RUT-taket är 75 000 kr/person/år, dvs. max 37 500 kr i avdrag - inget en
  vanlig privatkund kommer i närheten av för datorhjälp, men bra att känna
  till om en kund frågar.

### Företag och föreningar (ingen RUT, momspliktigt B2B)

- Timpris för IT-support till mindre företag: **900-1 800 kr/h exkl. moms**
  är det normala spannet; en jämförd aktör tar 1 280 kr/h för kvalificerade
  nätverks-/IT-tjänster.
- Nätverksinstallation (Wi-Fi, kabeldragning, gästnät) offereras ofta som
  **fast pris snarare än timpris**: enklare jobb ca 7 000-12 000 kr,
  mer omfattande (flera våningar, VLAN, fler accesspunkter) upp mot
  20 000-25 000 kr eller mer. Tidsåtgång för en enklare installation är
  ofta 1-3 timmar på plats, men fastpriset inkluderar planering och
  efterkontroll.

### Vad det betyder för Nova IT specifikt

- **Enskild firma-perspektivet är viktigt att räkna på ordentligt, inte bara
  kopiera marknadspriset.** Ett riktmärke för att räkna fram ett hållbart
  timpris som egenföretagare: önskad nettolön → bruttolön (nettolön × ~1,4
  beroende på kommunalskatt) → lägg på egenavgifter (28,97 %) → lägg på
  overhead (försäkring, bokföring, verktyg, resor, ev. kontor) → dela på
  realistiskt fakturerbara timmar per månad (ofta 100-130 av 160 möjliga,
  eftersom administration, resor och obetald tid äter av kapaciteten).
  Det ger sannolikt ett *lägsta* hållbart timpris som bör jämföras mot
  marknadsspannet ovan innan ett pris sätts - annars räknar Nova IT på sig
  själv, inte på marknaden.
- Nova IT:s nuvarande positionering (lokal, personlig, Hässelby/Västerort,
  enskild firma - se `src/lib/service-region.ts` och `src/lib/nova-data.ts`)
  talar för att ligga i den **nedre-mellersta delen** av privatpersons-
  spannet snarare än i toppen: det matchar "lokal och personlig hjälp"
  bättre än ett premiumbolag med kontor och flera anställda, samtidigt som
  det måste vara högt nog för att vara hållbart som enda inkomstkälla i en
  enskild firma (se föregående punkt).
- Företagssidan (`Nätverk och säkerhet`-kategorin, Microsoft 365/Google
  Workspace) motiverar ett högre timpris eller fastprisofferter - det är
  redan uppdelat så i tjänstekatalogen (`category: "Nätverk och säkerhet"`
  vs. `"Datorer och support"`), vilket passar bra ihop med att B2B-arbete
  generellt tar högre pris än privatkunder.
- Nätverksinstallation passar bättre som **fastprisofferter** (i linje med
  hur marknaden redan gör det) än som ett löst timpris - enklare för kunden
  att förstå och enklare för Nova IT att räkna hem overhead-tiden
  (planering, inköp, efterkontroll) som annars inte syns i ett rent timpris.

### Nästa steg för Stefan

1. Räkna igenom "vad kostar en fakturerbar timme egentligen"-formeln ovan
   med verkliga siffror (önskad lön, faktiska omkostnader).
2. Jämför resultatet mot marknadsspannet ovan och välj en positionering
   (lågpris/lokal, mitten, eller premium).
3. Sätt ett första utkast till pris per tjänst i tabellen nedan.

### Prisutkast per tjänst (fylls i av Stefan)

| Tjänst (slug i koden) | Kategori | Föreslagen modell | Prisintervall (utkast) |
| --- | --- | --- | --- |
| `it-support` | Datorer och support | Timpris | - |
| `natverk` | Nätverk och säkerhet | Fastpris/offert | - |
| `datorinstallation` | Datorer och support | Fastpris eller timpris | - |
| `felsokning` | Datorer och support | Timpris | - |
| `sakerhet-backup` | Nätverk och säkerhet | Timpris eller paket | - |
| `microsoft-google` | Datorer och support | Timpris eller paket | - |
| `datorservice` | Datorer och support | Fastpris (bedömning) + timpris (arbete) | - |

### Prisförslag för de fyra prioriterade nya kandidaterna (utkast, ej beslutat)

Se `docs/tjanster-kandidater-arbetsdokument.md` för rangordningen bakom
dessa fyra. Siffrorna är Claudes förslag utifrån marknadsspannet ovan - inte
ett beslut. Alla siffror är RUT-berättigade privatpriser (arbete i hemmet),
angivna som pris **innan** avdrag följt av vad kunden faktiskt betalar
**efter** 50 % RUT inom parentes.

| Ny tjänst | Föreslagen modell | Prisförslag (innan / efter RUT) | Kommentar |
| --- | --- | --- | --- |
| Ominstallation | Fastpris | 900-1 200 kr (450-600 kr) | Förutsägbar arbetsinsats (2-3 h), passar fastpris bättre än timpris. |
| Virussanering | Fastpris, akutpåslag möjligt | 800-1 100 kr (400-550 kr) | Håll under ominstallation - annars uppfattas det som "dyrare att inte formatera om". |
| Dataräddning | Från-pris + bedömning | Från 600 kr för bedömning, sedan offert | Spännvidden i faktiskt arbete är för stor för ett enda pris - bedömning kostar litet, resten offereras. |
| Uppdatering/underhåll (abonnemang) | Månadsabonnemang | 149-249 kr/månad | RUT gäller sannolikt inte ett löpande abonnemang på samma sätt som ett engångsbesök - kräver en snabb koll innan det publiceras, se juridisk-punkten nedan. |

**Juridisk flagg:** abonnemangsmodellen (uppdatering/underhåll) och
RUT-avdragets tillämpning på återkommande tjänster bör stämmas av samtidigt
som `docs/juridisk-granskning-underlag.md` gås igenom - inte antas.

### Källor

- [Hjälp med dator hemma i Göteborg: din guide 2026](https://hemmasupport.se/hjalp-med-dator-hemma-i-goteborg-din-guide-2026/)
- [IT-support för äldre i Stockholm 2026 - Datahjälp](https://www.datahjalp.nu/it-support-aldre-stockholm-enkel-hjalp-2026/)
- [Vad kostar IT-support för ett litet företag? – Smartify](https://www.smartify.se/blogg/it-support-kostnad-foretag)
- [Prislista IT-support i Malmö | Timpris & RUT-avdrag](https://www.minitsupport.se/Kundservice/Prislista/)
- [Vad kostar IT-support? Pris, faktorer & RUT-avdrag | Offerta](https://offerta.se/guider/ovrigt/vad-kostar-it-support)
- [RUT-avdrag för datorhjälp | FALK DATA](https://falkdata.se/rut-avdrag-datorhjalp-i-hemmet/)
- [Timpris-kalkylator konsult 2026 – kalkylverket.se](https://kalkylverket.se/kalkylatorer/foretagande/pris-marginal/timpris-konsult-kalkylator)
- [IT-konsult, så sätter du rätt timpris | Wint](https://www.wint.se/blogg/it-konsult-sa-satter-du-ratt-timpris)
- [Så sätter du rätt timpris som egenföretagare - Allt om företagande](https://alltomforetagande.se/fakturering/hur-mycket-ska-jag-fakturera-per-timme/)
- [Priser för IT-support för företag i Stockholm – hothelp.se](https://hothelp.se/priser-for-foretag/)
- [Guide till nätverksinstallation i Stockholm 2026](https://it-support-stockholm.se/guide-natverksinstallation-stockholm-2026/)

## Publiceringsvillkor

Priserna går live först när:

1. Bolaget självt går live (se övriga launch-beslut i `docs/roadmap.md`).
2. Prislistan är godkänd av Stefan.
3. Eventuella juridiska krav på prisinformation är avstämda.

Fram tills dess hålls detta dokument och eventuell prisdata utanför publik
kod/kod-path (dvs. inte i `src/routes` eller andra ställen som renderas på
live-sajten).
