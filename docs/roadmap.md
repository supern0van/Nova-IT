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
- [x] Slutjustera kundtext, tjänstebeskrivningar och kontaktbudskap sida för sida (Grind 6, UI/UX- och språköversyn).
- [x] Förbättra SEO metadata och social preview-texter (Grind 6).
- [x] Göra en tillgänglighetsrunda: fokus, kontrast, labels och tangentbord (Grind 6, WCAG AA-kontrastfixar).
- [x] Göra en pre-deploy-runda med riktig mobil viewport (verifierat 375/768/1440px, Lighthouse körd mot skarp produktion).
- [ ] Flytta e-postens DNS från tidigare Strato-poster till Loopias verifierade MX-, SPF-, DKIM- och DMARC-poster.

## Kundportal (pågående)

Egen repo, Worker och databas - se `docs/kundportal-planering.md` (arkitektur,
kärnbeslut, milstolpar) och `docs/kundportal-arbetsorder.md` (aktuell arbetsorder)
samt `docs/DECISIONS.md` (DEC-0006) för det som redan är beslutat.

- [x] Milstolpe 0: separat Supabase-projekt (`nova-it-kundportal`), separat
      GitHub-repo (`supern0van/Nova-IT-Kundportal`), Worker deployad på
      `kundportal.nova-it.se`, CI grönt.
- [x] Milstolpe 1: datamodell och autentisering (kundkonton, tvingat lösenordsbyte).
- [x] Milstolpe 2: automatiskt kundkonto + välkomstmejl vid nytt ärende.
- [x] Milstolpe 3: kunden ser sina egna ärenden.
- [x] Milstolpe 4: kundinitierat svar på ärende.
- [x] Milstolpe 4b: glömt-lösenord-flöde (Supabase Auth, implicit flow, egen
      Nova IT-märkt e-postmall).
- [ ] Milstolpe 5: säkerhets- och release-granskning.
- [ ] Milstolpe 6: lansering (DNS-omläggning av `portal.nova-it.se`/`portal.novait.se`).

## Senare beslut som kräver ägarinput

- Riktig kontaktmejl, telefon och geografiskt område.
- Riktiga kontaktuppgifter, ort/område och eventuell juridisk bolagsinformation.
- Om robotassistenten ska kopplas till backend, ärendesystem eller AI API.
- Vilka kundcase, priser eller erbjudanden som faktiskt får visas.
