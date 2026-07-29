# Arbetsorder: Kundportal

Senast uppdaterad: 2026-07-29
Föregås av: `docs/kundportal-planering.md` (läs den först)

## Milstolpe 0 — KLAR (2026-07-29)

Se `docs/DECISIONS.md` (DEC-0006) för de beslut som fattades. Sammanfattning:

- Supabase-projekt `nova-it-kundportal` (org "Nova-IT", `eu-west-1`, 0 kr/mån).
- GitHub-repo `supern0van/Nova-IT-Kundportal` (privat).
- Cloudflare Worker `nova-it-kundportal` på `kundportal.nova-it.se`, live och
  verifierad (200 OK).
- CI grönt (test/lint/typecheck/build).
- B2 (autentiseringsmetod) och B3 (glömt-lösenord i M2) är fortsatt INTE
  slutgiltigt bekräftade av ägaren - arbetet nedan fortsätter med
  rekommendationen (lösenord + tvingat byte) som arbetshypotes. Bekräfta eller
  ändra i slutsamlingen av manuella beslut.

## Milstolpe 1 — Datamodell och autentisering (klar, med ett kvarstående manuellt steg)

### Uppgifter

1. **Migration i `nova-it-kundportal`:** tabell `kund_konton` (id, `admin_kund_id`
   text, `auth_user_id` uuid → `auth.users`, `maste_byta_losenord` boolean
   default true, `skapad`/`uppdaterad`). Samma säkerhetsmönster som
   adminportalens `profiles`-tabell: RLS aktiverad som försvar-på-djupet, men
   `anon`/`authenticated` får inga privilegier - all åtkomst sker server-side
   med service-rollnyckeln.
2. **Supabase-klienter:** `lib/supabase/service.ts` (service-roll, server-only)
   och `lib/supabase/server.ts` (`@supabase/ssr`, användarens egen session i
   Route Handlers/Server Components) - speglar adminportalens uppdelning.
3. **Inloggningssida** (`/logga-in`): e-post + lösenord mot Supabase Auth.
4. **Tvingat lösenordsbyte:** efter lyckad inloggning, kontrollera
   `kund_konton.maste_byta_losenord` server-side. Om sant: omdirigera till
   `/byt-losenord` innan något annat är nåbart. Formuläret sätter nytt lösenord
   via Supabase Auth och `maste_byta_losenord = false`.
5. **Tom, skyddad "inloggad"-vy** (`/mina-arenden`, ingen riktig ärendedata än)
   - bara för att bevisa att sessionskontrollen fungerar.
6. **Manuellt testkonto:** skapa ett testkonto (via Supabase Auth Admin API,
   ett litet engångsskript) för att verifiera hela flödet end-to-end.

### Definition of Done

- [x] Migration applicerad, verifierad med `list_tables`/`execute_sql`.
- [x] Ett manuellt skapat testkonto kan logga in på `/logga-in` (verifierat live
      i webbläsare mot det riktiga Supabase-projektet).
- [x] Middleware nekar oautentiserade anrop till `/mina-arenden`/`/byt-losenord`
      (verifierat: 401 utan sessionskaka).
- [x] Inloggningen tvingar lösenordsbyte första gången. Fullt
      end-to-end-verifierat live i webbläsare (2026-07-29) sedan ägaren satte
      `SUPABASE_SERVICE_ROLE_KEY` lokalt: testkontot loggade in med det
      tillfälliga lösenordet → tvingades till `/byt-losenord` → nytt lösenord
      satt, `maste_byta_losenord` bekräftat `false` i databasen → utloggning
      → ny inloggning med det NYA lösenordet gick direkt till `/mina-arenden`
      utan omväg.
- [x] CI grönt (test/lint/typecheck/build).
- [x] Huvudrepot och adminportalen opåverkade (verifierat: CI fortsatt grönt
      där, `kundportal.nova-it.se` fortsatt M0-placeholdern - M1-koden är
      pushad men INTE deployad live än, se nedan).

### Deployad och verifierad live (2026-07-29)

M1-koden är deployad till `kundportal.nova-it.se` (manuell `wrangler deploy` via
WSL, samma metod som M0 - ingen Cloudflare Workers Build-koppling/GitHub-
integration finns än för det nya repot). Samtliga tre secrets
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`) är satta på Workern.

Ett par lärdomar från driftsättningen, värda att komma ihåg till nästa milstolpe:

- `NEXT_PUBLIC_`-variabler måste vara satta som miljövariabler VID BYGGET
  (`opennextjs-cloudflare build`), inte bara som Worker-secrets - annars bakas
  `undefined` in i klientbunten. Löst genom att exportera dem i WSL-skalet
  innan build kördes, precis som Turnstile-fixen på den publika sajten.
- Ett första försök att sätta `SUPABASE_SERVICE_ROLE_KEY` misslyckades - kommandot
  kördes med nyckelvärdet som SECRET-NAMN istället för värde
  (`wrangler secret put <värde>` istället för `wrangler secret put
  SUPABASE_SERVICE_ROLE_KEY` följt av värdet vid prompten). Det felaktiga namnet
  exponerade nyckeln i klartext via `wrangler secret list` och därmed i
  verktygsloggar. Åtgärdat: det felaktiga secret-namnet togs bort, nyckeln
  roterades i Supabase Dashboard, och det korrekta namnet sattes om. En andra
  rond hade sedan fortfarande en felaktig/otillräcklig nyckel (gav 404 i
  `/api/kund/konto` trots att raden fanns verifierad i databasen via direkt
  SQL) - löst efter att ägaren kopierade om nyckeln en gång till.

Live-verifierat efter fix: `/api/kund/konto` svarar `{"ok":true,"masteBytaLosenord":false}`
för en inloggad session, `401` utan session, `/mina-arenden` ger `307` till
`/logga-in` utan session.

## Milstolpe 2 — Automatiskt kundkonto + välkomstmejl (KLAR, 2026-07-29)

### Vad som byggdes

1. **`nova-it-kundportal`:** skyddad endpoint `POST /api/internal/kundkonto`
   (`app/api/internal/kundkonto/route.ts` + `lib/admin/kundkonto-server.ts`).
   Verifierar en delad hemlighet (`x-kundportal-intag-secret` mot
   `KUNDPORTAL_INTAG_SECRET`), skapar kontot idempotent (kollar `kund_konton`
   på `admin_kund_id` först, hanterar Supabase Auths `email_exists` som "har
   redan konto" snarare än ett hårt fel), genererar ett 20-tecken
   tillfälligt lösenord med `crypto.getRandomValues`.
2. **Adminportalen:** `skapaPubliktIntag` (i `publikt-intag-server.ts`) anropar
   den nya endpointen efter att ärendet skapats - soft-fail (kastar aldrig,
   blockerar aldrig det redan skapade ärendet). `internt`-svaret från
   `/api/public/intag` bär nu vidare `kundportalKonto: { kontoSkapat,
   tillfalligtLosenord }`.
3. **Publika sajten:** `contact-server.ts`/`contact-submission.ts` skickar med
   inloggningsuppgifter (länk, e-post, tillfälligt lösenord) i kundens
   bekräftelsemejl, men ENDAST när `kontoSkapat === true` - en återkommande
   kund som redan har ett konto ser bara den vanliga bekräftelsetexten.
   Lösenordet loggas aldrig, syns bara i det ena mejlet.
4. **`KUNDPORTAL_INTAG_SECRET`:** genererad av assistenten (egen
   server-till-server-hemlighet, delar aldrig värde med `INTAG_SECRET`), satt
   på både `nova-it-admin`- och `nova-it-kundportal`-Workers via `wrangler
   secret put`.

### Definition of Done

- [x] Migration/kod för `kund_konton`-skapande klar och testad (enhetstester i
      alla tre repon, se respektive `*.test.ts`).
- [x] `KUNDPORTAL_INTAG_SECRET` satt på båda Workers.
- [x] Alla tre system deployade: `supern0van-nova-it` (publika sajten),
      `nova-it-admin` (adminportalen), `nova-it-kundportal`.
- [x] Ett riktigt ärende skapat via `/kontakt` på `nova-it.se` resulterar i ett
      välkomstmejl med ett fungerande engångslösenord, verifierat end-to-end
      i skarp miljö (ärendenummer NIT-2903, 2026-07-29 kväll): kunden fick
      bekräftelsemejlet i sin Gmail-inkorg.

### Lärdomar och incidenter från driftsättningen

- **NEXT_PUBLIC-fällan igen:** ombygget av `nova-it-kundportal` för M2 kördes
  om i WSL utan att `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  fanns som miljövariabler vid byggtillfället (ingen `.env.local` fanns kvar i
  den WSL-sessionen). Upptäckt genom att grepa efter projekt-URL:en i den
  byggda klientbunten innan deploy. Löst genom att skriva en `.env.local` med
  URL:en och den publicerbara nyckeln (båda offentliga, ofarliga värden) innan
  ombygget - samma mönster som M1, men nu dokumenterat så att nästa ombygge
  inte upprepar misstaget.
- **WSL saknade git-autentisering mot det privata kundportal-repot:** `git
  pull` hängde tyst (väntade på ett användarnamn/lösenord som aldrig kom, utan
  TTY). Löst genom att peka WSL:s git mot Windows Git Credential Manager
  (`git config --local credential.helper` i `~/kundportal`) - en lokal,
  ej incheckad inställning, inte kod.
- **`RESEND_API_KEY` saknades helt på den publika sajtens Worker** när M2:s
  e2e-test först kördes - ett ärende skapades, men inget mejl skickades
  (varken internt eller till kunden). Detta var ett redan existerande
  produktionshål, inte något som M2-arbetet orsakade. Ägaren satte nyckeln
  själv (`wrangler secret put RESEND_API_KEY --name supern0van-nova-it`) -
  första värdet visade sig vara ogiltigt hos Resend (401 "API key is
  invalid"), ägaren genererade/kopierade om nyckeln en gång till, varefter
  ett nytt testärende (NIT-2903) gick igenom utan fel i `wrangler tail` och
  bekräftelsemejlet kom fram.
- **En separat, ej sammanslagen gren (`agent/changelog-catchup-2026-07-29`,
  troligen från en parallell ChatGPT-session)** grenar från en punkt FÖRE
  både M2-mejlarbetet och Turnstile-produktionshärdningen (commit `273ae4a`).
  Om den grenen slås samman mot `main` utan ombasering först skulle den tyst
  ta bort båda funktionerna. Inte åtgärdat av assistenten - flaggat till
  ägaren, kräver ombasering innan sammanslagning.

## Milstolpe 3/4 — Visa egna ärenden + kundinitierat svar (KLAR, 2026-07-29)

Byggda och körda som ett sammanhängande flöde, se `docs/kundportal-planering.md`
för den ursprungliga scope-beskrivningen.

### Vad som byggdes

1. **Adminportalen:** tre nya server-till-server-endpoints
   (`lib/admin/kundarenden-server.ts` + `app/api/internal/kundarenden/route.ts`,
   `app/api/internal/kundarenden/[id]/route.ts`,
   `app/api/internal/kundmeddelande/route.ts`), skyddade av en NY, egen
   hemlighet `ADMINPORTAL_INTAG_SECRET` (motsatt riktning mot
   `KUNDPORTAL_INTAG_SECRET` - kundportalen anropar HIT den här gången).
   Listar en kunds ärenden, hämtar ett ärende med konversation (interna
   meddelanden filtreras alltid bort), och sparar ett kundsvar - som
   automatiskt flyttar ärendet från `vantar_pa_kund` till `pagaende`.
   Varje funktion verifierar självständigt att ärendet tillhör den
   `adminKundId` som skickats med, oavsett vad anroparen redan påstår.
2. **Kundportalen:** `lib/admin/adminportal-client.ts` anropar adminportalens
   nya endpoints. Till skillnad från Milstolpe 2:s kontoskapande (soft-fail)
   kastar detta riktiga fel vid problem - att visa/skicka ärenden är en
   primär kundfunktion, inte en tilläggsberikning. `/mina-arenden` listar nu
   kundens riktiga ärenden, och en ny `/mina-arenden/[id]`-vy visar
   konversationen med ett svarsformulär (dolt om ärendet är stängt).
3. Adminportalens egen route-kontraktstest (`app/api/api-route-contract.test.ts`)
   uppdaterades för att räkna in de tre nya routes som medvetna
   server-till-server-vägar (samma kategori som `public/intag`).

### Definition of Done

- [x] Alla nya lib-/route-tester gröna (22 nya i adminportalen, 12 nya i
      kundportalen), CI-kontrakt (test/lint/typecheck/build) grönt i båda
      repona.
- [x] `ADMINPORTAL_INTAG_SECRET` satt på båda Workers, alla tre system
      deployade.
- [x] End-to-end-verifierat i webbläsare (2026-07-29) med ett dedikerat
      testkonto (skapat via den befintliga `/api/internal/kundkonto`,
      städat bort igen efter verifieringen): en inloggad testkund
      (M3-Test Kund A) såg EXAKT sina två egna ärenden (NIT-2509, NIT-2510)
      - INTE en tredje kunds ärende (NIT-2511, M3-Test Kund B) som fanns i
      samma databas. Ett svar skrivet i kundportalen på det öppna ärendet
      dök omedelbart upp i databasen med `avsandare: 'kund'` och rätt
      `avsandare_namn`, och ärendets status gick automatiskt från
      `vantar_pa_kund` till `pagaende`. Det stängda ärendet visade
      korrekt ingen svarsmöjlighet alls.

### Lärdomar

- **Browserautomation i den inbäddade Browser-panen orsakade upprepade
  krascher** av själva Claude Code-appen under den här sessionen (krävde
  force-close + reparation flera gånger). Bytte därför till Claude in
  Chrome (användarens egen, synliga webbläsarflik) för all vidare
  webbläsarverifiering - stabilt genom hela Milstolpe 3/4-arbetet.
- Ett återkommande mönster i den webbläsaren: formulärfält fyllda direkt
  efter ett `ref`-baserat klick hann ibland inte hydrera innan `type`
  kördes, vilket gav tomma fält. Löst genom att klicka på koordinater,
  skriva, och ta en skärmdump för att bekräfta innehållet innan nästa steg
  - långsammare men pålitligt.
- `KUNDPORTAL_INTAG_SECRET`s tidigare värde fanns inte kvar i den här
  sessionens kontext (genererades i en tidigare, sedan sammanfattad, del av
  samtalet) - eftersom det är assistentens EGEN interna hemlighet (inte en
  tredjepartsuppgift) roterades den bara om och sattes på nytt på båda
  Workers, i stället för att försöka återskapa/gissa det gamla värdet.

## Milstolpe 5 — Härdning och release-granskning (nästa)

Se `docs/kundportal-planering.md` för fullständig beskrivning (extern
säkerhetsgenomgång, legal/integritetsgranskning, rate limiting, loggning).
Skrivs som en egen, detaljerad arbetsorder när ägaren vill fortsätta. B2
(autentiseringsmetod) och B3 (glömt lösenord) är fortfarande öppna
ägarbeslut, se Milstolpe 0 ovan - bör beslutas innan release-granskningen.
