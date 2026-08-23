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
- **Robotassistenten - avstängningen är avklarad, inte ett öppet läge.**
  Assistenten stängdes av avsiktligt 2026-08-21
  (`SUPPORT_ASSISTANT_IS_ONLINE = false`, NOVA-0061) och ska förbli avstängd
  tills vidare - det är ett medvetet, redan fattat och avslutat beslut, inte
  något som väntar på vidare bearbetning eller kod. `/assistent` togs bort
  ur `public/sitemap.xml` för att matcha noindex-läget (NOVA-0062). Den är
  för övrigt redan kopplad till Cloudflare Workers AI sedan
  NOVA-0040/0043/0044/0047/0048 (se `support-ai.ts`/`support-ai-server.ts`,
  `docs/supportassistent-ai-drift.md`) - regelmotorn är inte hela historien.
  Om/när den ska tillbaka online är ett separat, framtida beslut.
- **Admin-dashboard-automation**: inkluderar även att koppla in Nova IT:s
  Loopia-mejlkonton (`kontakt@`, `support@`, `info@`, `webmaster@`,
  `no-reply@`) som en funktion i adminportalen, så att mejl kan läsas och
  besvaras direkt därifrån i stället för i en separat mejlklient. Ingen
  koppling till ett separat ärendesystem planeras just nu. Planeringsunderlag
  (Loopia = IMAP/SMTP, ingen egen API, teknisk knäckfråga är IMAP-stöd i
  Cloudflare Workers) i `docs/admin-mail-integration-planering.md`.
- **Priser**: marknadsresearch klar, se `docs/priser-arbetsdokument.md`.
  Stefan sätter faktiska priser utifrån underlaget. Publiceras inte på den
  publika sajten förrän bolaget går live.
- **Fler tjänster**: kandidatlista för nya tjänster utöver de nuvarande sju
  finns i `docs/tjanster-kandidater-arbetsdokument.md` (internt, ej publikt).
- **SEO**: kodnära SEO bedöms klar (Lighthouse SEO 100/100, all planerad
  strukturerad data på plats). Kvarvarande möjlighet är off-page: en Google
  Business-profil, se `docs/public-site-grind6-audit.md` (uppföljning
  2026-08-23).
