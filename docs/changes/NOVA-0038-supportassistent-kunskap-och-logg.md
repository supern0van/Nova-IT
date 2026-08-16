# NOVA-0038 – Supportassistenten fick bredare förståelse och blev en ärendelogg

```yaml
datum: 2026-08-16
datumprecision: dag
typ: funktion
status: genomförd
system: [publik webbplats, adminportal]
```

Supportassistenten kunde tidigare bara föra vidare en kort sammanfattning till
kontaktformuläret. Själva dialogen – vad kunden faktiskt svarade på guidens
frågor – fanns bara i webbläsarens `sessionStorage` och försvann när fliken
stängdes. Den kunskapsbas som styrde matchningen täckte tolv områden med
relativt smala nyckelordslistor, vilket gjorde att naturligt formulerade
beskrivningar ofta hamnade i "Annat problem".

## Bredare kunskapsbas

Kunskapsbasen gick från 12 till 17 områden. Fem nya täcker vanliga ärenden som
tidigare saknade eget spår:

- Skärm och bild
- Videomöten, kamera och ljud
- Extern hårddisk, USB och minneskort
- Genomgång, rengöring och allmän service
- Nätverk för kontor, förening eller flytt

Samtliga områdens nyckelordslistor breddades med vardagliga formuleringar,
engelska låneord och vanliga stavvarianter. `datorservice` togs med som
tjänstemål, vilket det inte var tidigare trots att tjänsten fanns i katalogen.

## Bättre matchning

Matchningen i `support-engine.ts` känner nu igen svenska böjningsformer genom
en enkel stemmer, så att "långsammare" landar i samma spår som "långsam".
Dubblerad slutkonsonant kollapsas, vilket annars hade gjort att just den
vanligaste svenska böjningsformen aldrig matchade.

Angelägenhetsbedömningen utökades: uttryck som antyder att arbetet står still
höjer prioriteten utan att ändra kategorin, och tecken på begynnande
datahaveri höjer prioriteten i backup- och lagringsspåren.

## Konversationen följer med in i ärendet

Överlämningen till kontaktformuläret bär nu ett `transcript`-fält (version 3)
med kundens egna ord och de val som gjorts i guiden. Det komponeras in i
ärendets beskrivning och når därmed adminportalen via det befintliga
`/api/public/intag` – samma väg som kontaktformuläret redan använder. Ingen ny
infrastruktur, inga nya hemligheter.

Transkriptet innehåller medvetet **inte** guidens råd och checklistor. De är
skrivna för kunden, inte för teknikern som ska läsa ärendet.

Den sammansatta beskrivningen kortas nu innan den skickas, så att den aldrig
kan överskrida adminportalens hårda gräns på 2000 tecken. Kundens egna ord
prioriteras: guidens metadata kortas först.

## Visuell översyn

Guiden hade fem olika kortutseenden staplade på varandra, vilket fick flödet
att se ihopsatt ut. Allt neutralt innehåll använder nu ett enda kortutseende.
Färg är reserverad för två lägen som faktiskt betyder något: rött för
säkerhetsläge där kunden bör sluta klicka, gult för när det är läge att höra
av sig.

Panelen leds nu av Nova IT-märket i stället för en prick som kunde läsas som
en online-status. Rubriken säger uttryckligen att guiden är automatisk och att
ingen personal läser förrän kunden skickar.

## Verifiering

- `bun run typecheck`: passerar.
- `bun test`: 61 tester passerar.
- `bun run lint`: 0 fel.
- `bun run build`: produktionsbygge genomfört.
- Manuellt verifierat i dev: fritexten "kameran syns inte i teams och hela
  kontoret står still" matchade det nya videomötesspåret, förde med sig
  beskrivning och förvald tjänst till kontaktformuläret, och visade rätt
  kontaktorsak.
- Mobil (375px) och desktop (1280px): ingen horisontell overflow, panelen
  ligger korrekt i båda lägena.

## Kvarstår

Supportassistenten är fortfarande regelbaserad och anropar ingen extern
AI-tjänst. Om en språkmodell ska kopplas in senare krävs separata beslut om
databehandling, kostnad, driftansvar och missbruksskydd – se
`docs/supportbot-integration-report.md`.
