# Rapport: visuell redesign

## Syfte

Det här passet förde Nova IT från en tekniskt förbättrad men visuellt generisk demo till en mer sammanhållen, tydlig och professionell frontend. Arbetet gjordes utan att skriva om applikationen eller ta bort fungerande flöden.

## Genomförda förändringar

- nytt gemensamt designsystem med återanvändbara sidhuvuden, sektioner, demo-notiser, statuspaneler och CTA-block
- ny färg-, typografi- och ytriktning med off-white, grafit och djup teal
- omarbetad startsida med tydligare hero, driftpanel, tjänstekarta, process och slut-CTA
- tydligare tjänstekort och en mer operativ tjänstesida
- omarbetad frågeguide med valbara kategorier, strukturerade svar och koppling till rätt tjänst
- förbättrat kontaktformulär med tydliga steg, synligt tjänsteval, svensk samtyckesvalidering och förbättrad success-vy
- ny `/case-study` som dokumenterar projektets utvecklingsstege
- uppdaterad navigation, mobilmeny och footer
- visuellt uppdaterade FAQ- och Om oss-sidor

## Bevarat för att undvika regression

- svensk lokalisering och svenska systemtexter
- demo-säkra formuleringar utan falska bolagsuppgifter
- tjänsteförval via `/kontakt?service=<slug>`
- formulärvalidering och tillgänglighetsattribut
- tangentbords- och fokuslägen
- frontend-only-positioneringen för frågeguiden
- befintliga routes och TanStack-projektstruktur

## Verifiering

- Prettier körd
- ESLint körd utan fel; sex befintliga varningar om `react-refresh/only-export-components` kvarstår
- produktionsbuild genomförd utan fel
- samtliga routes kontrollerade i mobil vy, inklusive svensk 404
- mobilnavigation öppnad och kontrollerad
- kontaktformulärets tjänsteförval och svenska felmeddelanden kontrollerade
- frågeguidens val, svar och kontakt-CTA kontrollerade
- horisontell mobil overflow på kontaktsidan hittades och åtgärdades

## Nästa steg

Nästa avgränsade pass är att porta supportbotens användbara kunskapsflöden till React/TypeScript, låta `/assistent` och en global robotwidget dela samma motor och därefter verifiera hela applikationen på nytt.
