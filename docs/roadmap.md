# Roadmap

Den här listan ska hålla fokus på hemsidan och undvika att projektet sprids över gamla zippar eller parallella källor.

## Grund

- [x] GitHub `main` är huvudkälla.
- [x] Lokal arbetsmapp är `C:\Users\stefa\Documents\Nova IT`.
- [x] Supportboten är integrerad i React/TanStack-projektet.
- [x] Ren leverans-zip kan skapas från Git.
- [x] CI verifierar test, lint, typecheck och build.
- [x] Cloudflare Workers är kopplad till `nova-it.se` med HTTPS och aliasomdirigeringar.
- [x] README, projektstatus och projekthistorik gör GitHub-repot lättare att navigera.
- [x] Kontaktadresserna är förberedda i kod och hålls dolda tills de ska visas publikt.
- [x] Produktions- och förhandsflöde är dokumenterat så att `main` kan hållas stabil.

## Nästa hemsidepass

- [x] Granska startsidan och förstärka nästa-steg-innehåll.
- [x] Kontrollera att alla tjänstekort leder rätt.
- [x] Gå igenom `/kontakt` och gör bokningsflödet tydligare.
- [x] Se över `/tjanster` så varje tjänst känns konkret och säljbar utan att bli överdriven.
- [x] Kontrollera den flytande robotassistenten mot skarpare ärendefokus.
- [ ] Slutjustera kundtext, tjänstebeskrivningar och kontaktbudskap sida för sida.
- [ ] Förbättra SEO metadata och social preview-texter.
- [ ] Göra en tillgänglighetsrunda: fokus, kontrast, labels och tangentbord.
- [ ] Göra en pre-deploy-runda med riktig mobil viewport.
- [ ] Flytta e-postens DNS från tidigare Strato-poster till Loopias verifierade MX-, SPF-, DKIM- och DMARC-poster.

## Senare beslut som kräver ägarinput

- Riktig kontaktmejl, telefon och geografiskt område.
- Riktiga kontaktuppgifter, ort/område och eventuell juridisk bolagsinformation.
- Om robotassistenten ska kopplas till backend, ärendesystem eller AI API.
- Vilka kundcase, priser eller erbjudanden som faktiskt får visas.
- När kundportalen ska få ett separat repo, Worker och databas.
