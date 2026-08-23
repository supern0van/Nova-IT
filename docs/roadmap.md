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
- [x] E-post-DNS: inte en flytt utan redan rätt sedan start - Loopia äger brevlådorna, Cloudflare äger DNS/namnserver för `nova-it.se`. Bekräftat vid livegenomgång 2026-08-03, se `docs/email-dns-handoff.md`.

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
- [x] Milstolpe 5: kod-/konfigurationsgranskning av auth, integritetstext och
      rate limiting (se `docs/m5-auth-privacy-review.md`). Externt
      penetrationstest och juridisk slutgranskning färdigkontrollerade
      2026-vecka 34 (bekräftat av Stefan; källdokumenten ligger i
      `supern0van/Nova-IT-Kundportal`, inte i detta repo).
- [x] Milstolpe 6: `portal.nova-it.se`/`portal.novait.se` flyttade från
      `nova-it-admin` till `nova-it-kundportal`s egen Worker - live sedan
      2026-07-30.

Kundportalen är därmed komplett genom M0-M6 - inget kvarstår som blockerar
skarp drift.

## Beslut från ägaren (2026-08-23)

- **Kontaktuppgifter**: se `docs/project-status.md` för de fastställda
  publika/interna kontaktuppgifterna (e-post, telefon, geografiskt område,
  org.nr/firmaform). Hemadressen hålls avsiktligt utanför den publika sajten
  (se NOVA-0055) och finns bara i interna/juridiska dokument.
- **Robotassistenten**: ska kopplas till en riktig AI-backend - nuvarande
  regelbaserade motor är för dålig på att förstå fritextfrågor ("kan du
  förklara igen" händer för ofta). Ingen koppling till ett separat
  ärendesystem planeras just nu; fokus är i stället en bättre admin-dashboard
  där fler funktioner automatiseras. Enstaka regler kan behövas som skydd
  runt AI-svaren, men det utreds inte förrän ombyggnaden av assistenten
  påbörjas.
- **Priser**: arbete med tjänstepriser påbörjas nu internt, men publiceras
  inte på den publika sajten förrän bolaget går live. Se
  `docs/priser-arbetsdokument.md`.
