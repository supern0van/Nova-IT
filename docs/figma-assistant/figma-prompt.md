# Prompt för Figma Make

Designa om endast Nova IT:s automatiska ärendeguide och dess överlämning till kontaktformuläret. Utgå från de bifogade referensbilderna och behåll webbplatsens befintliga mörka, sakliga och tekniska formspråk. Detta är en designförfining av en fungerande produkt, inte en ny chatbot och inte en redesign av hela webbplatsen.

## Syfte

Guiden ska hjälpa en kund att välja korrekt kontaktorsak och samla ett bättre underlag så att Nova IT kan göra en snabbare första bedömning. Den ska inte ge reparationsinstruktioner eller ersätta en betald supportkontakt. Alla färdiga flöden ska leda vidare till Nova IT:s kontaktformulär.

## Utforska först tre riktningar

Gör tre tydligt skilda men varumärkesmässigt konsekventa desktopförslag bredvid originalreferensen:

1. `A – Compact utility panel` – rekommenderad huvudriktning. En kompakt arbetsyta med tydlig hierarki, låg visuell ljudnivå och få dekorativa element.
2. `B – Conversational minimal` – något mjukare dialogkänsla, men utan stora pratbubblor eller mänsklig persona.
3. `C – Structured stepper` – tydligare steg och sektioner, men utan att dölja eller radera tidigare val.

Panelen får vara rektangulär, men ska kännas proportionerlig och lätt. Testa en något smalare eller visuellt lättare form än dagens 390 × 640 px. Behåll en tydlig relation till launcher-knappen och sidans nedre högra hörn. Undvik en enorm flytande AI-yta.

Efter jämförelsen: välj den riktning som bäst kombinerar tydlighet, låg friktion och Nova IT:s affärsmål. Bygg alla obligatoriska tillstånd i den valda riktningen.

## Visuellt språk

- Bas: mörk blåsvart, lågmälda blågrå ytor, tunna svala linjer och en kontrollerad ljusblå accent.
- Typografi: Inter. Saklig, kompakt och tydlig; undvik överdrivet stora rubriker i panelen.
- Hörn: små till medelstora radier, cirka 6–12 px. Ingen pill-form på stora behållare.
- Ikoner: enkla linjeikoner i samma stil som Lucide. Använd inte emoji, AI-orb, robotansikte eller illustrerad maskot.
- Accentfärg används för fokus, valt läge och primär handling; inte som stora färgblock överallt.
- Säkerhetsläge får en dämpad rose/röd ton och ikon, men får inte se ut som ett systemfel.
- Ingen gradient, glasig neonestetik eller generisk SaaS-chatbot-look.

## Obligatoriska skärmar och tillstånd

Skapa minst följande namngivna frames:

### Desktop, 1440 × 1024

- `D01 Launcher / Closed`
- `D02 Guide / Start`
- `D03 Guide / Topic selected`
- `D04 Guide / Choices changed + history`
- `D05 Guide / Ready summary`
- `D06 Guide / Security priority`
- `D07 Guide / Low confidence clarification`
- `D08 Guide / Keyboard focus`
- `D09 Contact / Locked handoff`
- `D10 Contact / Customer typing`

### Mobile, 390 × 844

- `M01 Launcher / Closed`
- `M02 Guide / Start`
- `M03 Guide / Active flow + history`
- `M04 Guide / Ready summary`
- `M05 Guide / Security priority`
- `M06 Contact / Locked handoff`

Mobilversionen ska fungera som en bottenförankrad arbetsyta med egen scrollregion och fast inmatningsdel. Den får inte skapa horisontell scroll eller täcka viktiga kontroller. Respektera safe areas.

## Interaktion och prototyp

- Launcher öppnar panelen och visar öppet/stängt/fokus-läge.
- Stängknappen är minst 44 × 44 px. Escape stänger på desktop och fokus återgår till launcher.
- Val visar normal, hover, focus, pressed och selected.
- Ett ändrat val läggs till i `Dina val i ordning`; historiken försvinner inte.
- Det senaste valet styr den aktuella sammanfattningen, medan äldre val ligger kvar som historik.
- Låg säkerhet i matchningen ska visa en kort följdfråga, inte en självsäker felklassning.
- `Fortsätt med underlaget` öppnar kontaktformuläret med vald tjänst och en låst kontaktorsak.
- Kundens beskrivning är alltid ett separat, tomt och redigerbart textfält under den låsta kontaktorsaken.
- Visa fel, tomt läge och fokus utan att enbart förlita dig på färg.

## Affärsmässiga och juridiska gränser

- Skriv aldrig steg som lär kunden att reparera problemet själv.
- Tillåt endast en allmän försiktighetsåtgärd vid akut säkerhetsrisk, till exempel att inte fortsätta klicka eller logga in på den berörda enheten.
- Guiden får inte lova rätt diagnos, svarstid eller lösning.
- Visa tydligt att den är automatisk.
- Integritetsnotisen ska finnas nära textinmatningen: skriv inte lösenord, personnummer eller bankuppgifter; undvik uppgifter om andra om de inte behövs; inget skickas innan kunden väljer kontakt.
- Kontaktformulärets integritetsbekräftelse ligger kvar före sändning.

## Komponentleverans

Bygg återanvändbara komponenter med varianter för launcher, panel, header, automatiskt meddelande, kundval, ämnesknapp, valknapp, historikrad, prioriteringskort, underlagslista, redo-kort, sammanfattningsdetaljer, inmatningsrad, låst kontaktorsak och kundens textarea.

Använd Auto Layout, namngivna text- och färgstilar, variabler för färg/radie/spacing och tydliga komponentnamn. Lägg utvecklaranteckningar vid mått, scrollbeteende, sticky-delar, fokusordning och responsiva skillnader.

## Tillgänglighet

- Minst 44 × 44 px för primära klickytor.
- Minst 2 px synlig fokusindikator.
- WCAG AA-kontrast för text och kontroller.
- Valstatus kommuniceras med text/ikon/ram, inte endast färg.
- Layouten ska fungera vid 200 % zoom och med längre svenska texter.
- Rör inte webbplatsens navigering, FAQ-innehåll eller övriga sidlayout mer än vad som behövs för att visa guiden i kontext.

## Viktiga förbud

Lägg inte till namnet Nova som persona, en stor vy-länk, ChromeOS Flex, kostnadsinformation, självhjälpsinstruktioner, generativa AI-löften, chattavatar, emoji eller en ny separat assistentsida. Förändra inte flödets affärslogik när du utforskar den visuella formen.
