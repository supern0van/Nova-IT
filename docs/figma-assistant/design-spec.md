# Designspecifikation

## 1. Källa och nuläge

Den fungerande implementationen och skärmbilderna i `assets/` är källa för beteende och innehåll. Figma får förenkla presentationen, men inte ändra betydelsen i flödet.

Nuvarande desktop-panel är 390 px bred och högst 640 px hög. Mobilpanelen är bottenförankrad och högst 700 px eller viewportens höjd minus 8 px. Använd dessa mått som jämförelse, inte som ett absolut krav på slutlig visuell storlek.

## 2. Designtokens att utgå från

| Token | Nuvarande källa | Avsikt |
|---|---|---|
| Background | `oklch(0.13 0.021 247)` | Sidans mörka blåsvarta bas |
| Foreground | `oklch(0.965 0.008 245)` | Primär text |
| Card | `oklch(0.17 0.022 247)` | Upphöjd yta |
| Primary | `oklch(0.71 0.145 243)` | Ljusblå handling/fokus |
| Primary foreground | `oklch(0.16 0.025 247)` | Text på ljusblå yta |
| Secondary | `oklch(0.205 0.025 247)` | Sekundär yta |
| Border | `oklch(0.33 0.022 247)` | Tunna avgränsningar |
| Destructive | `oklch(0.577 0.245 27.325)` | Fel/varning, sparsamt |
| Base radius | `8 px` | Kontroller och mindre kort |
| Font | `Inter` | All gränssnittstext |

Panelens nuvarande ytor ligger nära `#081018`, header/inmatning nära `#071018` och launcher nära `#090f15`. Behåll färgfamiljen även om kontrast och nivåskillnader justeras.

## 3. Typografisk hierarki

- Paneltitel: 16 px, semibold.
- Kort underrad i header: 12–13 px, regular, dämpad.
- Meddelanderubrik: 14 px, semibold.
- Brödtext: 13–14 px, line-height 1.45–1.55.
- Knapp/val: 14 px, medium eller semibold.
- Metadata, historiketikett och integritetsnotis: 11–12 px, dämpad men fortsatt AA-läsbar.
- Använd versaler och ökad teckenmellanrum endast för korta sektionsetiketter.

## 4. Komponenter och varianter

| Komponent | Obligatoriska varianter |
|---|---|
| `Assistant/Launcher` | closed, hover, focus, open |
| `Assistant/Panel` | desktop, mobile; start, active, ready, priority |
| `Assistant/Header` | default, compact mobile |
| `Assistant/Guide message` | normal, classification, clarification, completion |
| `Assistant/User selection` | single line, wrapped |
| `Assistant/Topic button` | default, hover, focus, selected |
| `Assistant/Choice button` | default, hover, focus, pressed, selected, disabled |
| `Assistant/History row` | situation, impact, timeline |
| `Assistant/Checklist row` | numbered, complete |
| `Assistant/Priority card` | security warning |
| `Assistant/Ready card` | incomplete, ready |
| `Assistant/Composer` | empty, focus, filled, disabled submit, enabled submit |
| `Contact/Locked reason` | one line, wrapped, with context |
| `Contact/Customer description` | empty, focus, filled, error |

## 5. Händelsekedja

Flödet är inte en vanlig chattlogg och inte en linjär wizard som raderar bakåt. Designen ska visa följande samband:

1. Kunden väljer eller skriver ett område.
2. Guiden klassificerar kontaktorsaken utan att lova diagnos.
3. Kunden gör ett situationsval.
4. Kunden kan ändra situationsval; båda händelserna finns kvar i kronologisk historik.
5. Senaste valet används i den aktuella sammanfattningen.
6. Påverkan och tidsbild läggs till.
7. Redo-läget visar exakt vilket underlag som går vidare.
8. Kontaktformuläret visar en låst kontaktorsak och ett separat tomt fält för kundens egna ord.

Figma-prototypen måste demonstrera steg 3–5, eftersom det är den viktigaste skillnaden mot dagens upplevelse av att ett tidigare val "försvinner".

## 6. Innehållstillstånd

### Start

Sex vanligaste områden visas direkt. Övriga öppnas via `Visa alla områden`. Fri text är ett alternativ, inte den enda vägen.

### Klassificerat ärende

Visa vald kategori, en kort motivering, information om att guiden inte ger reparationssteg samt möjlighet att gå vidare med det underlag som redan finns.

### Aktiv frågekedja

Valfrågor får vara kompakta kort eller segmenterade kontroller. Vald status ska vara entydig. Historik ska vara synlig eller lätt att nå utan att upplevas raderad.

### Redo

Visa `Förslag: [tjänst]`, en kort beredskapsstatus, möjlighet att kontrollera sammanfattningen och en tydlig primär handling: `Fortsätt med underlaget`.

### Prioriterad säkerhet

Visa en dämpad men tydlig varning. Den får innehålla en försiktighetsåtgärd men inte tekniska återställningssteg.

### Kontaktöverlämning

Kontaktorsaken och guidekontexten ligger i en låst, visuellt nedtonad yta. Instruktionsmeningen är mindre och dämpad. Textfältet `Din beskrivning` börjar tomt och ligger direkt under.

## 7. Responsivitet

- Desktop: panelen ska inte täcka onödigt stor del av sidans innehåll.
- Mobil: en kolumn, full användbar bredd, safe-area-padding och egen scrollregion.
- Header och composer ligger fasta; loggen scrollar mellan dem.
- Långa svenska etiketter ska radbrytas utan kapning.
- Primär CTA ska kunna nås utan horisontell scroll.
- Testa 320, 375, 390, 768 och 1440 px bredd i Figma.

## 8. Granskningsfrågor

- Ser användaren direkt att detta är en automatisk ärendeguide, inte en person?
- Är panelen tydligt mindre dominant än sidans huvudinnehåll?
- Är tidigare val synliga efter att ett val ändras?
- Förstår användaren vad som kommer att följa med till kontaktformuläret?
- Går det att skilja låst kontaktorsak från kundens redigerbara text?
- Finns en tydlig väg till Nova IT i varje slutfas?
- Ger designen någon oavsiktlig känsla av gratis teknisk support?
- Håller mobilversionen samma informationshierarki utan överfullhet?
