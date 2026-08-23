# Fler tjänstekandidater — arbetsdokument (internt, ej publicerat)

Påbörjat: 2026-08-23. Beslutat av Stefan: fler tjänsteidéer ska tas fram
utöver de sju som redan finns i `src/lib/nova-data.ts` - **inget här ska
in i publik kod eller synas på nova-it.se** förrän Stefan har valt ut och
godkänt vilka som ska läggas till, i linje med samma publiceringsvillkor
som `docs/priser-arbetsdokument.md`.

## Nuvarande sju tjänster (referens)

`it-support`, `natverk`, `datorinstallation`, `felsokning`,
`sakerhet-backup`, `microsoft-google`, `datorservice` - se
`src/lib/nova-data.ts`.

## Kandidater - vardags-IT och datorer (privatpersoner)

- **Ominstallation av Windows/macOS** - ren ominstallation vid tröga eller
  skräpiga datorer, skiljer sig från `felsokning` (som är diagnos) och
  `datorservice` (som är hårdvarubedömning).
- **Virussanering och skadlig kod** - akut ärende, egen kategori värt att
  namnge explicit i stället för att gömmas i `it-support`. Kunder söker ofta
  specifikt på "virus".
- **Dataräddning** - filer som försvunnit, korrupt disk, oavsiktlig
  radering. Hög betalningsvilja när det är akut, ett tydligt eget
  sökbart behov.
- **Skärm-/batteribyte, komponentbyte i bärbar dator** - konkret,
  prissättningsbart, ligger nära `datorservice` men är mer
  "reparationsverkstad" än "bedömning".
- **Skrivare och kringutrustning** - installation, nätverksdelning,
  felsökning. Nämns i `it-support`s exempel idag men kan bära en egen rad
  om det är vanligt förekommande.
- **Uppdatering och underhåll (städning av dator)** - schemalagd/återkommande
  genomgång: uppdateringar, diskstädning, säkerhetskopiering, prestanda.
  Passar bra som ett abonnemang/paket snarare än engångsinsats - se
  `docs/priser-arbetsdokument.md` om paketprissättning.
- **Mobiltelefon- och surfplattehjälp** - kontoinställningar, överföring
  mellan enheter, grundläggande felsökning. Många IT-hjälpfirmor för
  privatpersoner erbjuder detta som en naturlig sidotjänst till
  datorhjälpen.
- **Smart hem / IoT-uppsättning** - smarta lampor, kameror, högtalare,
  routrar med föräldrakontroll. Naturlig förlängning av `natverk`.
- **Seniorsupport / grundutbildning** - riktad hjälp och enkel utbildning
  för äldre användare (mejl, Bank-ID, videosamtal). Kan vara ett tydligt
  differentierande erbjudande givet Nova IT:s lokala, personliga profil.
- **Lösenordshanterare och kontosäkerhet (privat)** - uppsättning av
  lösenordshanterare, tvåfaktor, granskning av gamla/återanvända lösenord.
  Delvis redan täckt av `sakerhet-backup`, men kan brytas ut som en egen,
  mer lättsåld "engångsinsats".

## Kandidater - företag och föreningar

- **IT-drift/supportavtal (löpande, ej engångsinsats)** - fast
  månadskostnad för proaktiv övervakning/support, i stället för bara
  timdebiterade engångsärenden. Det här är den tjänst som skiljer ett
  återkommande intäktsflöde från ett rent hantverksarvode - värt att
  fundera på som ett eget "paket" snarare än en vanlig tjänsterad.
- **Onboarding/offboarding av medarbetare** - nya datorer, konton,
  behörigheter vid anställning; indragning vid avslut. Efterfrågat hos
  små företag som inte har egen IT-avdelning.
- **GDPR-/digital grundsanering för föreningar** - genomgång av
  medlemsregister, delade dokument, e-postlistor. Ligger nära Nova IT:s
  egen kompetens (se det egna GDPR-arbetet i `docs/register-over-behandlingar.md`)
  och är ett tydligt föreningsbehov som sällan är prioriterat internt.
- **Föreningswebbplats/enkel hemsidehjälp** - många föreningar har en
  gammal eller ostrukturerad hemsida (t.ex. WordPress) som ingen sköter.
  Kan vara en naturlig tilläggstjänst given att Nova IT redan bygger och
  driver egna webbplatser.
- **Möteslösningar (Teams/Zoom/skärmar)** - uppsättning av mötesrum,
  delade skärmar, ljud för mindre kontor och föreningslokaler.
- **Serverunderhåll/NAS-lösningar för mindre företag** - filserver, backup,
  behörigheter, utan att gå ända upp i en fullskalig IT-drift.

## Kandidater som kräver mer eftertanke innan de läggs till

- **Webbutveckling/e-handel** - stort steg utanför "IT-support"-identiteten,
  konkurrerar mer direkt med renodlade webbyråer. Kan vara värt om Nova IT
  redan gör det informellt, annars avvakta.
- **Gaming-dator-bygge** - annan kundgrupp (entusiaster snarare än
  vardags-IT), men kan vara en bra nischtjänst om efterfrågan redan finns
  lokalt.
- **Drönare/avancerad IoT-säkerhet** - sannolikt för nischat för nuvarande
  skala, tas inte med som förslag att gå vidare med nu.

## Rekommendation (Claudes rangordning, 2026-08-23)

Rangordnat efter tre saker: (a) hur väl det matchar det Nova IT redan gör
solo, (b) hur sökbart/efterfrågat behovet är för en enskild firma, (c) hur
lätt det är att prissätta utan mycket mer research. Stefan väljer/stryker -
det här är ett förslag till startordning, inte ett facit.

**Ta med direkt, minimal risk:**
1. **Ominstallation** - i praktiken redan en del av `felsokning`/`datorservice`
   i huvudet på kunden, men saknar en egen sökbar rad. Lägst risk av alla.
2. **Virussanering** - eget, mycket sökt begrepp; kunder söker sällan på
   "IT-support" när datorn har virus, de söker på "virus".
3. **Dataräddning** - hög betalningsvilja, akut behov, tydligt avgränsat.
4. **Uppdatering/underhåll som abonnemang** - den enda kandidaten som ger
   återkommande intäkt på privatsidan i stället för engångsarvoden. Värt att
   prioritera högt av rent affärsmässiga skäl, inte bara efterfrågan.

**Ta med, kräver lite mer eftertanke på avgränsning:**
5. **Seniorsupport** - starkt differentierande för en lokal, personlig
   enskild firma, men bör formuleras varsamt (inte kategoriserande) och
   fungerar bäst ihop med ett vänligt, tydligt språk - något Nova IT redan
   är bra på givet Grind 6-arbetet.
6. **IT-drift/supportavtal för företag** - den viktigaste kandidaten på
   företagssidan rent affärsmässigt (återkommande intäkt), men kräver mest
   förarbete: vad ingår, hur många kunder klarar en enskild firma samtidigt
   på ett avtal, SLA-förväntningar. Börja skissa nu, men det behöver mer tid
   än de andra innan det kan publiceras.
7. **GDPR-/digital sanering för föreningar** - bra match med Nova IT:s egen
   GDPR-kompetens, men smalare målgrupp (kräver att hitta föreningar som
   inser behovet) än de rena privatpersons-tjänsterna.

**Lägre prioritet just nu (inte fel att ha med, men mindre bråttom):**
- Skärm-/batteribyte, skrivarhjälp, mobil/surfplatta, smart hem,
  lösenordshanterare (privat) - alla rimliga, men mer "en rad bland andra"
  än egna dragplåster. Bra att fylla på med när kärnlistan är klar.
- Onboarding/offboarding, föreningswebbplats, möteslösningar,
  serverunderhåll/NAS - vettiga företags-/föreningstillägg men mindre
  brådskande än supportavtalet.

**Håll utanför denna omgång** (redan Stefans egen bedömning, bekräftad ovan
i "kräver mer eftertanke"): webbutveckling/e-handel, gaming-dator-bygge,
drönare/avancerad IoT-säkerhet.

## Nästa steg

1. Stefan väljer ut vilka kandidater som känns rätt för verksamheten och
   stryker resten.
2. De valda tjänsterna paras ihop med priser i
   `docs/priser-arbetsdokument.md` (samma tjänst, samma rad).
3. Först när både tjänst och pris är beslutat läggs de in i
   `src/lib/nova-data.ts` och blir synliga - inte innan.
