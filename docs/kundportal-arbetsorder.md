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

## Milstolpe 2 — Automatiskt kundkonto + välkomstmejl (nästa)

Se `docs/kundportal-planering.md` för fullständig beskrivning. Skrivs som en
egen, detaljerad arbetsorder när Milstolpe 1:s kvarstående manuella steg är
avklarat.
