# Promptindex och projektläge

Det här dokumentet är projektets gemensamma karta. Syftet är att undvika att gamla chattar eller lösa promptfiler blir den enda källan till vad som redan har gjorts.

## Verifierat nuläge

| Steg                     | Status        | Bevis/resultat                                                                                                    |
| ------------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| Lovable-export           | Genomförd     | Första committen `3340de8` finns kvar som projektets historiska startpunkt. Ingen separat Lovable-branch används. |
| Codex förbättringspass 1 | Genomfört     | Commits `d8e0803` och `ae1911f`; senaste stabila kod ligger på `main`.                                            |
| GitHub-grund             | Genomförd     | Privat repo `supern0van/Nova-IT`, standardbranch `main`.                                                          |
| Visuell redesign         | Genomförd     | Nytt designsystem, omarbetade sidor och `/case-study`; se `docs/visual-redesign-report.md`.                       |
| Supportbot i React       | Nästa steg    | Plan finns i `docs/supportbot-integration-plan.md`.                                                               |
| Riktig backend/AI        | Inte påbörjad | Ska inte byggas innan frontend, säkerhet och databehandling är beslutade.                                         |

## Vad första Codex-passet redan förbättrade

- svensk lokalisering och `lang="sv"`
- svensk 404- och fel-UI
- demo-säkra formuleringar
- borttagning av falska bolagsuppgifter
- bättre tjänstestruktur
- tjänsteförval via `/kontakt?service=<slug>`
- bättre formulärvalidering och tillgänglighetsattribut
- frontend-only supportguide med tydlig avgränsning

## Ordning framåt

1. Porta supportbotens kunskapsbas och flöde till React/TypeScript.
2. Återanvänd samma supportmotor på `/assistent` och i robotwidgeten.
3. Verifiera mobil, tangentbord, formulär, botflöden, lint och build.
4. Utvärdera backend, ticketing eller riktig AI först därefter.

## Branchregler

- `main` är stabil och aktuell.
- Större arbeten sker på en ny branch.
- Publicerad historik ska inte force-pushas eller skrivas om.
- Genererade mappar, beroenden och arkiv ska inte committas.
