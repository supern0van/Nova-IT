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
- [~] Inloggningen tvingar lösenordsbyte första gången - koden är skriven och
      enhetstestad (6 tester, `/api/kund/konto` + `/api/kund/byt-losenord`),
      men **inte verifierad live lokalt**: `/api/kund/konto` kräver
      `SUPABASE_SERVICE_ROLE_KEY`, som jag varken har eller hämtar själv
      (Supabase-MCP:t exponerar den inte, och jag skriver aldrig in såna
      nycklar). Felet är bekräftat fail-closed (500 med tydligt
      felmeddelande, aldrig en tyst felaktig inloggning). Kvarstår som ett
      manuellt steg: sätt `SUPABASE_SERVICE_ROLE_KEY` lokalt (`.env.local`,
      gitignorad) eller i en teständtligt miljö, logga in med testkontot
      (`milstolpe1-test@example.com`) och bekräfta att `/byt-losenord` visas
      och att bytet faktiskt nollställer flaggan.
- [x] CI grönt (test/lint/typecheck/build).
- [x] Huvudrepot och adminportalen opåverkade (verifierat: CI fortsatt grönt
      där, `kundportal.nova-it.se` fortsatt M0-placeholdern - M1-koden är
      pushad men INTE deployad live än, se nedan).

### Ej deployad live än

M1-koden ligger bara i GitHub-repot, inte deployad till `kundportal.nova-it.se`.
Att deploya nu skulle kräva `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
som byggtidsvariabler (samma fallgrop som `VITE_TURNSTILE_SITE_KEY` på den
publika sajten - Vite/Next bakar in `NEXT_PUBLIC__`-variabler vid bygget, inte
vid körning) och `SUPABASE_SERVICE_ROLE_KEY` som runtime-secret. Ingen
Cloudflare Workers Build-koppling (GitHub-integration) finns än för det nya
repot heller - M0:s deploy gjordes manuellt via `wrangler deploy` i WSL.
Detta är medvetet uppskjutet till dess att secrets är på plats, i linje med
regeln att aldrig deploya något som inte fungerar.

## Milstolpe 2 — Automatiskt kundkonto + välkomstmejl (nästa)

Se `docs/kundportal-planering.md` för fullständig beskrivning. Skrivs som en
egen, detaljerad arbetsorder när Milstolpe 1:s kvarstående manuella steg är
avklarat.
