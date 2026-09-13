---
id: NOVA-0079
date: 2026-09-13
date_precision: day
type: fixed
status: completed
systems:
  - public-site
---

# Bred repogranskning: launcher dold bakom kakbannern + trasig FAQ-länk

## Vad ändrades?

- **`src/components/cookie-consent.tsx` + `src/features/support/SupportBotLauncher.tsx`:**
  Kakbannerns omdesign till en sidbred rad (NOVA-0078) döljer den flytande
  supportlanserarknappen helt bakom sig (samma bottenhörn, bannern har högre
  z-index). Bannern rapporterar nu sin faktiska renderade höjd via CSS-
  variabeln `--nova-cookie-banner-h` (satt/nollställd med en `ResizeObserver`
  medan den är synlig), och launchern lägger till den i sin egen
  `bottom`-offset. Fungerar oavsett hur mycket bannerns text radbryter på
  olika skärmbredder, och samspelar korrekt med launcherns befintliga
  `nearFooter`-logik.
- **`src/routes/faq.tsx`:** Pilknappen "Beskriv ett ärende" bredvid FAQ-introt
  saknade `form: "request"` i sin `search`-props till `/kontakt` - till
  skillnad från varje annan liknande CTA-länk i kodbasen. Utan det fältet
  landar `/kontakt` på den rena kontaktuppgifts-vyn (`ContactInformation`) i
  stället för det faktiska ärendeformuläret, trots att knappens `aria-label`
  och synliga ikon lovar motsatsen.

## Varför?

Uppföljning på en uttrycklig begäran om en grundlig genomgång av hela
Nova-IT-repot (portalerna redan klara, huvudsidans layout/design redan
åtgärdad i en tidigare omgång, se NOVA-0078). Bred läsning av server-
funktioner (kontakt, ärendestatus, supportchattens AI-skyddslager),
komponenter, samtliga routor, CI-workflows och beroenden. De två ovan var
de enda konkreta, verifierbara buggarna som hittades - resten av kodbasen
(särskilt säkerhetslagren i `contact-server.ts`, `case-status-server.ts`
och `support-chat.ts`/`support-tools.ts`) höll en genomgående hög,
väldokumenterad standard.

## Resultat

- Launcherknappen ("Fråga oss") hamnar nu alltid synlig ovanför kakbannern,
  verifierat på 1440px och 390px bredd, och återgår korrekt till sitt
  normala läge när bannern stängs. (Just nu utan synlig effekt i produktion
  - `SUPPORT_ASSISTANT_IS_ONLINE` är `false` - men regressionen hade slagit
  igenom direkt vid nästa påslagning utan den här fixen.)
- FAQ-sidans "Beskriv ett ärende"-pil tar nu faktiskt besökaren till
  ärendeformuläret, verifierat med en klick-genomgång mot en lokal
  dev-server.
- `bun test` (178/178), `bun run lint` och `bun run typecheck` gröna, inga
  nya varningar.

## Dokumentationspåverkan

Ingen.
