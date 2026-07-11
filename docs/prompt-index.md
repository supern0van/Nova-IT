# Projektläge och historik

Det här dokumentet är projektets gemensamma karta. Syftet är att hålla nuläge, historik och nästa tekniska beslut samlade i projektet.

## Verifierat nuläge

| Steg                     | Status        | Bevis/resultat                                                                                                    |
| ------------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| Lovable-export           | Genomförd     | Första committen `3340de8` finns kvar som projektets historiska startpunkt. Ingen separat Lovable-branch används. |
| Codex förbättringspass 1 | Genomfört     | Commits `d8e0803` och `ae1911f`; senaste stabila kod ligger på `main`.                                            |
| GitHub-grund             | Genomförd     | Privat repo `supern0van/Nova-IT`, standardbranch `main`.                                                          |
| Visuell redesign         | Genomförd     | Nytt designsystem, omarbetade sidor och `/arbetssatt`; se `docs/visual-redesign-report.md`.                       |
| Supportbot i React       | Genomförd     | Gemensam motor i den globala robotwidgeten; se `docs/supportbot-integration-report.md`.                           |
| Backend/ärendesystem     | Inte påbörjad | Kopplas först i samband med webbhotell, kontaktlösning och databehandling.                                        |

## Vad första Codex-passet redan förbättrade

- svensk lokalisering och `lang="sv"`
- svensk 404- och fel-UI
- skarpa formuleringar utan obekräftade påståenden
- borttagning av falska bolagsuppgifter
- bättre tjänstestruktur
- tjänsteförval via `/kontakt?service=<slug>`
- bättre formulärvalidering och tillgänglighetsattribut
- regelbaserad Nova-guide med tydlig kontaktinriktning

## Ordning framåt

1. Behåll `main` som stabil bas och dokumentera nya avgränsade mål innan nästa kodpass.
2. Utvärdera databehandling, samtycke och drift innan backend eller ticketing byggs.
3. Utvärdera eventuell AI eller ärendeintegration separat; robotassistenten ska vara regelbaserad tills drift, databehandling och supportansvar är beslutade.

## Branchregler

- `main` är stabil och aktuell.
- Större arbeten sker på en ny branch.
- Publicerad historik ska inte force-pushas eller skrivas om.
- Genererade mappar, beroenden och arkiv ska inte committas.
