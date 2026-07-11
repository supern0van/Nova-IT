# Integrationsplan för supportboten

> Status: genomförd. Resultat och verifiering finns i `docs/supportbot-integration-report.md`.

## Utgångsläge

Hemsidan har en enkel React-baserad supportguide på `/assistent`. Den fristående supportbotprototypen är byggd i vanilla HTML, CSS och JavaScript och innehåller fler ärendeflöden, följdfrågor, sammanfattning och en tydlig robotidentitet.

De två implementationerna ska inte köras parallellt. Prototypens användbara logik ska portas till projektets befintliga React/TypeScript-arkitektur.

## Delar som ska återanvändas

- lokal regelbaserad kunskapsbas
- 13 ärendetyper och följdfrågor
- första felsökningssteg och eskaleringsvillkor
- ärendesammanfattning och kopieringsfunktion
- robotfigur, teal/mint-identitet och reduced-motion-stöd
- tydlig möjlighet att starta om ett ärende

## Delar som inte ska kopieras in rått

- den fristående prototypsidans `index.html` och dess fristående CSS
- globala `window.*`-skript som permanent arkitektur
- fejkad `.se`-adress, telefonnummer och `mailto:`
- texten `Support online`
- skrivindikator som antyder AI eller liveoperatör
- ett andra kontaktformulär som konkurrerar med `/kontakt`
- rå `innerHTML` när innehållet kan renderas som React-noder

## Rekommenderad struktur

```text
src/features/support/
  support-data.ts
  support-engine.ts
  support-types.ts
  SupportGuide.tsx
  SupportBot.tsx
  SupportBotLauncher.tsx
```

`support-engine.ts` ska vara ren logik utan DOM-beroenden. Både `/assistent` och robotwidgeten ska använda samma datakälla och motor.

## Tjänstemappning

| Botområde                                   | Kontaktformulärets tjänst |
| ------------------------------------------- | ------------------------- |
| Långsam dator                               | `felsokning`              |
| Wi-Fi och nätverk                           | `natverk`                 |
| Windows, skrivare och allmänt               | `it-support`              |
| Installation, ChromeOS Flex och refurbished | `datorinstallation`       |
| Virus och backup                            | `sakerhet-backup`         |
| Konto och e-post                            | `microsoft-google`        |

Botens CTA ska använda `/kontakt?service=<slug>`. Kontaktuppgifter och fritext ska inte läggas i URL:en. En frivillig sammanfattning kan överföras via React-state/history-state eller kopieras av användaren.

## Tillgänglighet

- använd befintlig Radix Dialog eller Sheet
- korrekt namn och beskrivning för dialogen
- Escape och fokusåterställning
- synliga fokuslägen
- riktiga labels och kopplade felmeddelanden
- live-region endast där den faktiskt hjälper
- stöd för `prefers-reduced-motion`
- full mobil- och tangentbordskontroll

## Implementationsordning

1. Slutför visuellt designsystem.
2. Porta data och ren supportlogik.
3. Låt `/assistent` använda den gemensamma motorn.
4. Lägg till robotwidgeten i appskalet.
5. Koppla CTA till befintligt kontaktformulär.
6. Smoke-testa alla routes, mobil, tangentbord och tjänsteförval.
7. Håll kontakt- och AI-integration bakom tydliga gränssnitt tills drift, samtycke och säkerhet är beslutade.
