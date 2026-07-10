# Rapport: supportbot i React

## Resultat

Den fristående vanilla JavaScript-prototypens användbara delar har portats till projektets befintliga React/TypeScript-arkitektur. Den gamla demosidan och dess globala skript har inte kopierats in.

## Implementerat

- gemensamma typer, data och ren matchningslogik i `src/features/support`
- 13 regelbaserade ärendespår med första kontroller, eskaleringsvillkor och följdval
- automatisk lokal matchning av fritext mot relevant spår
- full Nova-guide på `/assistent`
- global robotwidget som kan öppnas från alla routes
- tillgänglig Radix-dialog med Escape-stängning och fokusåterställning
- frivillig kopiering av en demo-säker ärendesammanfattning
- tjänstemappad CTA till `/kontakt?service=<slug>`
- tydlig omstart av ett pågående guidesteg
- teal/mint-robotidentitet med hänsyn till reduced motion

## Medvetet utelämnat

- backend, databas, ärendesystem och riktig AI
- fejkad onlinestatus eller skrivindikator
- falska telefonnummer, e-postadresser och `mailto:`-flöden
- ett konkurrerande kontaktformulär i widgeten
- personuppgifter eller fritext i URL:en
- rå `innerHTML` och globala `window.*`-skript

## Verifiering

- Prettier körd
- sex enhetstester för regelmotorn genomförda utan fel
- ESLint körd utan fel; sex befintliga Fast Refresh-varningar kvarstår
- produktionsbuild genomförd utan fel
- global launcher kontrollerad på samtliga routes
- mobil dialoglayout kontrollerad visuellt
- 13 kategorier visas och kan väljas
- fritexten `Skrivaren är offline på kontoret` matchade skrivarspåret
- Wi-Fi-spår, följdval och sammanfattningskopiering kontrollerade
- kontakt-CTA stängde dialogen och förvalde `Nätverk och Wi-Fi`
- Escape stängde dialogen
- alla sidor, inklusive svensk 404, hade `lang="sv"` och noll horisontell overflow i mobil vy

## Nästa beslutspunkt

Frontend-etappen är komplett. Innan någon backend, ticketing eller riktig AI läggs till behövs separata beslut om databehandling, samtycke, säkerhet, driftansvar och vilka uppgifter som faktiskt ska skickas.
