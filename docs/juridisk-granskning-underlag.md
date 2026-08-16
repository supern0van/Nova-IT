# Underlag för juridisk granskning

Framtaget: 2026-08-16. **Detta är ett utkast skrivet av en utvecklare, inte av
en jurist.** Syftet är att en jurist ska kunna börja i sak i stället för att
kartlägga systemet först, och att Nova IT ska veta vad som faktiskt kvarstår.

Varje avsnitt är märkt med hur säkert underlaget är:

- **Fastställt** — verifierat i koden, går att lita på som beskrivning.
- **Bedömning** — teknisk bedömning som en jurist behöver pröva.
- **Öppet** — kräver ett beslut eller en uppgift som Nova IT måste lämna.

---

## 1. Verksamheten och systemen

**Fastställt.** Nova IT driver tre sammankopplade system:

| System | Roll | Personuppgifter |
| ------ | ---- | --------------- |
| Publik webbplats (`nova-it.se`) | Marknadsföring, supportguide, kontaktformulär | Kontaktuppgifter och fritext från den som hör av sig |
| Adminportal (`admin.nova-it.se`) | Operativ kärna: kunder, ärenden, bokningar, meddelanden | All operativ kunddata |
| Kundportal (`kundportal.nova-it.se`) | Kundens egen inloggning och ärendevy | Konto, inloggning, koppling till kundens ärenden |

Portalerna använder **separata Supabase-projekt** och kommunicerar
server-till-server över interna endpoints skyddade med delade hemligheter.
Kundportalens tjänsteklient når aldrig adminportalens kunddatabas direkt.

Personuppgiftsansvarig: Nova IT, org.nr 19870528-0652, Persikogatan 12,
165 63 Hässelby.

## 2. Personuppgiftsbiträden

**Fastställt** vilka som används:

| Biträde | Behandlar | Ändamål |
| ------- | --------- | ------- |
| Cloudflare | Trafikdata, IP, säkerhetsloggar; sedan 2026-08 även fritext vid AI-sortering | Drift, säkerhet, hosting, AI-inferens |
| Supabase | Kundkonton, autentisering, ärendedata | Databas och inloggning för portalerna |
| Resend | Namn, e-post, meddelandeinnehåll | E-postleverans |

**Öppet — detta måste Nova IT visa upp för juristen:**

- [ ] Är personuppgiftsbiträdesavtal (DPA) **tecknade och undertecknade** med
      Cloudflare, Supabase och Resend? Utkastet i
      `personuppgiftsbitradesavtal.md` är en mall, inte ett bevis på att avtal
      finns.
- [ ] Finns dokumenterad leverantörsbedömning för var och en?
- [ ] Är underbiträden hos respektive leverantör genomgångna och godkända?

## 3. Tredjelandsöverföring

**Bedömning.** Samtliga tre biträden är amerikanska bolag med global
infrastruktur. Personuppgifter kan därför behandlas utanför EU/EES.

**Öppet:**

- [ ] Vilken överföringsgrund åberopas för respektive leverantör? (EU-US Data
      Privacy Framework om leverantören är certifierad, annars
      standardavtalsklausuler.)
- [ ] Är en transfer impact assessment gjord?
- [ ] Går det att låsa Supabase-projekten till en EU-region? Det vore det
      enklaste sättet att minska exponeringen för den mest känsliga datan —
      kundkonton och ärendehistorik.

## 4. Rättslig grund per behandling

**Bedömning.** Nuvarande registret anger berättigat intresse för kontakt- och
ärendehantering, avtal när uppdrag inletts, rättslig förpliktelse för
bokföring och samtycke för valfria tekniker.

**Öppet:**

- [ ] Är en **intresseavvägning dokumenterad** för de behandlingar som vilar
      på berättigat intresse? Grunden i sig räcker inte — avvägningen ska gå
      att visa upp.
- [ ] Kundportalskonto skapas **automatiskt** när ett ärende registreras, utan
      att kunden begärt det. Juristen bör pröva om det ryms i berättigat
      intresse/avtal eller om det behöver vara ett aktivt val.

## 5. AI-behandlingen (ny 2026-08)

**Fastställt** om hur den fungerar:

- Kundens fritext i supportguiden kan skickas till en språkmodell hos
  Cloudflare Workers AI för att föreslå ärendekategori och en sammanfattning.
- Texten kapas till 600 tecken. Svaret sparas inte. Modellen tränas inte på
  datan.
- Cloudflare är **redan biträde** för webbdriften — inget nytt biträde
  tillkommer.
- Funktionen är **avstängd som standard** och slås på med `SUPPORT_AI_LAGE=pa`.
- Förslaget är rådgivande: kunden väljer själv, området byts aldrig
  automatiskt, och en människa hanterar alltid ärendet.

**Bedömning:** behandlingen utgör inte ett automatiserat beslut enligt
artikel 22, eftersom den varken har rättsliga följder eller på liknande sätt i
betydande grad påverkar den registrerade.

**Öppet:**

- [ ] Juristen bör bekräfta artikel 22-bedömningen.
- [ ] Behöver Cloudflares befintliga DPA utökas för AI-inferens specifikt,
      eller täcks det av det generella avtalet?
- [ ] Kan AI-förordningen (AI Act) aktualiseras? **Bedömning:** systemet
      klassificerar supportärenden och bör falla under minimal risk, med
      transparenskrav som redan uppfylls genom att guiden tydligt anges vara
      automatisk. Bör ändå prövas.

## 6. Konsekvensbedömning (DPIA)

**Öppet.** Ingen DPIA finns. **Bedömning:** verksamheten hanterar inte
känsliga kategorier enligt artikel 9, gör ingen systematisk övervakning och
ingen storskalig profilering, varför en DPIA sannolikt inte är obligatorisk.
Juristen bör dock avgöra, särskilt eftersom kundportalen kombinerar
inloggningsuppgifter med ärendehistorik.

## 7. Registrerades rättigheter

**Fastställt.** Integritetspolicyn beskriver rätt till tillgång, rättelse,
radering, begränsning, invändning och dataportabilitet, samt hänvisar till IMY.

**Öppet:**

- [ ] Finns en **rutin** för att faktiskt besvara en begäran inom en månad?
      Rättigheterna är beskrivna, men processen — vem gör vad, hur data
      plockas ut ur två separata Supabase-projekt — är inte dokumenterad.
- [ ] Hur raderas en kund fullständigt när båda portalerna innehåller data?

## 8. Gallring

**Fastställt.** Registret anger 12 månader för förfrågningar som inte leder
till ärende.

**Öppet:**

- [ ] Sker gallringen **automatiskt eller manuellt**? En dokumenterad
      lagringstid som ingen genomför är en risk i sig.
- [ ] Vilken lagringstid gäller för ärenden som lett till uppdrag, utöver
      bokföringslagens sju år för underlag?

## 9. Säkerhet

**Fastställt** — implementerat och verifierat i kod: MFA för adminportalen,
tvingat lösenordsbyte vid första inloggning i kundportalen, Turnstile,
honeypot och tidskontroll mot automatiserad spam, idempotensnycklar mot
dubbletter, CSP med nonce, HSTS, säkerhetsheaders, delade hemligheter för
server-till-server-anrop, konstant-tidsjämförelse av intagshemligheten.

**Öppet:**

- [ ] **Externt penetrationstest är inte utfört.** Detta är den enskilt
      största kvarvarande punkten.
- [ ] Finns en dokumenterad rutin för personuppgiftsincident, inklusive
      72-timmarsanmälan till IMY? `sakerhetsdrift-runbook.md` beskriver drift,
      men anmälningsvägen bör vara uttrycklig.

## 10. Avtalsvillkor mot kund

**Utkast finns nu skrivet.** Se
[`allmanna-villkor-it-tjanster.md`](allmanna-villkor-it-tjanster.md) — ett
fullständigt villkorsutkast i 16 punkter, inte en checklista. Det täcker
omfattning, pris och ändrad prisbild, kundens ansvar för säkerhetskopia,
dataförlust och ansvarsbegränsning, begagnad hårdvara, ångerrätt vid
distansavtal, betalning och retentionsrätt, ej avhämtad utrustning, avbokning,
force majeure, biträdesrollen vid företagskunder, sekretess, otillåten
användning och tvistlösning via ARN.

Utkastet skiljer genomgående på konsument och näringsidkare, eftersom en
ansvarsbegränsning som är giltig mot ett företag kan sakna verkan mot en
konsument.

`anvandarvillkor.md` (15 rader) täcker bara ändringar, avveckling och otillåten
användning och bör ersättas av eller arbetas in i det nya utkastet.

**Öppet — kvarstår i det nya utkastet:**

- [ ] Tio punkter är märkta **[JURIST]** respektive **[BESLUT]** direkt i
      texten och sammanställda sist i det dokumentet. De viktigaste är
      ansvarsbegränsningen vid dataförlust, ångerrättsrutinen och frågan om
      ansvarsförsäkring finns.

## 11. Sammanfattad prioritering

**Måste vara klart före bred lansering:**

1. Externt penetrationstest.
2. Undertecknade biträdesavtal med Cloudflare, Supabase och Resend.
3. Ansvarsbegränsning och tjänstevillkor, särskilt kring dataförlust.
4. Dokumenterad rutin för registrerades rättigheter och för incidenter.

**Bör vara klart, men blockerar inte:**

5. Dokumenterad intresseavvägning.
6. Tredjelandsbedömning per leverantör.
7. Beslut om automatiskt skapade kundportalskonton.
8. Ångerrätt och konsumenträttsliga villkor.

**Kan vänta:**

9. DPIA, om juristen bedömer den som frivillig.
10. Formell AI Act-bedömning.

---

## Vad som är gjort tekniskt i väntan på granskningen

Det publika ärendeintaget kan **låsas utan att sajten tas ner**, via
`PUBLIK_INTAG_LAGE=stangd`. Kontrollen sitter server-side och avvisar
inskickningar innan någon kunddata behandlas. Webbplatsen och supportguiden
fungerar som vanligt; kontaktsidan hänvisar till e-post.

AI-stödet är avstängt som standard och kräver ett uttryckligt
`SUPPORT_AI_LAGE=pa` för att aktiveras.

Det gör att granskningarna kan pågå medan sajten ligger uppe, i stället för
att behöva välja mellan att ta ner den eller ta emot skarpa personuppgifter i
förtid.
