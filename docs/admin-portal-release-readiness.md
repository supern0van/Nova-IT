# Adminportal — slutgiltig release-readiness (2026-07-28)

## Utgångsläge

```
HEAD:           5fb60f0 (main, origin/main, origin/HEAD)
Arbetsyta:      ren, inget diff mot HEAD
Senast deploy:  version d81ccba0-a958-425f-90eb-580ad846d2ce, 2026-07-28T19:29:05Z
                (motsvarar ungefär commit 6365ec6 — 3 senare commits är INTE live ännu)
```

Relevanta commits sedan föregående större pass:

| Commit | Beskrivning |
| --- | --- |
| `5fb60f0` | Bekräftelsedialog för "Markera som löst" |
| `ebf01e8` | UX-polish: 404-sida, borttagen död Vercel Analytics, "inga data" vs "kunde inte hämtas" |
| `d3e2e56` | Dokumenterat HTTPS/HSTS-status (ren dokumentation) |
| `c9926d6` | Säkerhetstester: trasiga payloads, saknad miljö, PUBLIC-execute |
| `6c656a1` | `server-only`-guard + migrationsversioner synkade mot live |
| `89cfa74`, `6365ec6` | Riktig personalmodell (ersatte hårdkodad demo-personal) |
| `7027606`…`13f8789` | Felhantering, dubbelklicksskydd, demo-fallback-tester, AAL2-widening |

## Bygggrindar

| Grind | Resultat |
| --- | --- |
| `pnpm test` | ✅ 51 testfiler, 366 tester |
| `pnpm lint` | ✅ grön |
| `pnpm exec tsc --noEmit --pretty false` | ✅ grön |
| `pnpm build` | ✅ grön |
| OpenNext build (`opennextjs-cloudflare build`, kört i WSL) | ✅ grön (endast ett känt, ofarligt tredjeparts-warning: duplicate object key i buntad floating-ui-kod) |
| `wrangler deploy --dry-run` | ✅ grön, korrekta bindningar (`WORKER_SELF_REFERENCE`, `ASSETS`) |
| `wrangler secret list --name nova-it-admin` | ✅ alla tre obligatoriska secrets satta (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) — endast namn kontrollerade, inga värden visade |

Windows-lokal `pnpm run deploy:dry-run` träffar det kända EPERM-symlinkfelet (OpenNext/Cloudflare-bunt på NTFS); samtliga byggsteg kördes i stället via den tidigare uppsatta WSL-miljön (`~/nova-it`), vilket är den etablerade lösningen för den här maskinen.

## Kontrollpunkter

| # | Kontroll | Status | Underlag |
| --- | --- | --- | --- |
| 1 | Oinloggad åtkomst till `/portal/*` | **VERIFIERAD** | `lib/supabase/proxy.test.ts` ("blockerad åtkomst: utloggad → /logga-in") + live smoke: alla 4 domäner ger 307 → `/logga-in?next=...` |
| 2 | AAL1-session nekas skyddat innehåll | **VERIFIERAD** (kod/test) · **EJ VERIFIERAD** (levande webbläsarsession) | `proxy.test.ts` ("aal1 skickas till /mfa, inte in i portalen"), `route-anvandare.test.ts`. Ingen levande aal1-session har körts genom webbläsaren — kräver ett riktigt konto som loggat in men inte klarat MFA. |
| 3 | Full AAL2-session ger åtkomst | **VERIFIERAD** (kod/test) · **EJ VERIFIERAD** (levande webbläsarsession) | `proxy.test.ts` ("aal2 släpps igenom"), `mfa.test.ts`. Jag anger aldrig lösenord/TOTP åt dig — kräver en människa med ett riktigt konto. |
| 4 | Admin- och medarbetarbehörigheter | **VERIFIERAD** | `app/api/admin/operativt/route.test.ts` (27 tester: administrator vs medarbetare per skriv-typ, inkl. `redigera_kund`/`tilldela_arende`-gating) |
| 5 | Skapa kund + hård refresh | **VERIFIERAD** (kod/test) · **EJ VERIFIERAD** (levande klick-igenom) | `kund-dialog.test.tsx`; server skriver till `admin_kunder` (verifierat schema live), `useOperativAdminData` läser om från samma API vid varje mount inkl. hård refresh — ingen localStorage-väg i produktion |
| 6 | Skapa ärende + hård refresh | Samma som ovan | `arende-dialog.test.tsx`, `admin_arenden`-schema verifierat live |
| 7 | Skapa bokning + hård refresh | Samma som ovan | `bokning-dialog.test.tsx`, `admin_bokningar`-schema verifierat live |
| 8 | Avboka bokning + hård refresh | Samma som ovan | `arende-detalj.test.tsx`, `bokningsvy.test.tsx` |
| 9 | Statusändring + hård refresh | Samma som ovan | `arende-atgarder.test.tsx` |
| 10 | Prioritetsändring + hård refresh | Samma som ovan | `arende-atgarder.test.tsx` |
| 11 | Tilldelning + hård refresh | Samma som ovan | `arende-atgarder.test.tsx` (inkl. `tilldela_arende`-gating) |
| 12 | Intern anteckning + hård refresh | Samma som ovan | `konversation.test.tsx` |
| 13 | Kundanteckning + hård refresh | Samma som ovan | `kund-anteckningar.test.tsx` |
| 14 | Aktivitetslogg och meddelanden | **VERIFIERAD** (kod) · **EJ VERIFIERAD** (levande) | `operativa-server.ts` loggar en aktivitet vid varje mutation (kod verifierad), täckt av `operativa-server.test.ts` |
| 15 | Dubbelklick och race conditions | **VERIFIERAD** | ~6 komponenttester "förhindrar dubbelklick"; DB: atomär Postgres-sekvens för ärendenummer + retry vid 23505 (`operativa-server.test.ts`) |
| 16 | Nätverksfel | **VERIFIERAD** | `store.test.ts`, `use-operativ-admin-data.test.tsx` (fail-closed i produktion), `DriftFelBanner` i UI |
| 17 | Alla fyra domäner | **VERIFIERAD** | Live smoke kört om just nu: samtliga 307/401 fail-closed korrekt; TLS-cert och HSTS verifierade i tidigare pass samma dag |
| 18 | Produktion använder inte tyst demo-fallback | **VERIFIERAD** | `store.test.ts` ("kastar i stället för att spara demo-data lokalt"), `use-operativ-admin-data.test.tsx` ("visar aldrig demo-/localStorage-kunder i produktion") |
| 19 | Felresponses läcker inte intern information | **VERIFIERAD** | Ingen `error.message` i `app/api/**`; `statusFranFel()` extraherar bara HTTP-status; `route.test.ts` ("läcker aldrig rå Postgres-feltext") |

**Blockerande kodfel hittade i denna omgång: inga.** Ingen ny kodändring krävdes — alla kontroller ovan bygger på redan existerande, gröna tester plus färsk live-verifiering.

## Kräver manuell åtgärd — kan inte kallas klart förrän gjort

### 1. Deploya de tre senaste commits till produktion

Live-Workern kör fortfarande ungefär commit `6365ec6` (senast deploy 2026-07-28T19:29Z). Commits `c9926d6`, `6c656a1`, `d3e2e56`, `ebf01e8` och `5fb60f0` är verifierade i kod/test men inte live.

1. **Var:** Lokal maskin (WSL, `~/nova-it/portal` — Windows träffar EPERM-symlinkfelet) eller CI/annan Linux-miljö.
2. **Kommando:** `git pull && pnpm install --frozen-lockfile && pnpm run deploy:production`
3. **Förväntat resultat:** Ny Worker-version publiceras för `nova-it-admin`, synlig via `wrangler deployments list`.
4. **Verifiering:** `node scripts/smoke-worker.mjs` grönt igen, samt manuell koll att en obefintlig URL nu visar den nya svenska 404-sidan (inte Next.js standard).
5. **Rollback:** `wrangler rollback --name nova-it-admin` till versionen `d81ccba0-a958-425f-90eb-580ad846d2ce` (nuvarande live-version) om något oväntat upptäcks.

### 2. Manuell AAL2- och webbläsarverifiering av en människa

Jag anger aldrig lösenord eller TOTP-koder åt dig — det är en gräns jag inte kan eller ska kringgå, oavsett att det är er egen adminportal. Följande måste köras av en människa med ett riktigt kontos uppgifter, efter att steg 1 ovan är klart:

1. **Var:** `https://admin.nova-it.se/logga-in`
2. **Åtgärd:** Logga in med ett konto som INTE har MFA konfigurerat ännu → verifiera att `/mfa`-enrollment visas, inte skyddat innehåll. Logga sedan in med ett konto med aktiv MFA, ange fel TOTP en gång → verifiera att åtkomst fortfarande nekas. Ange rätt TOTP → verifiera att `/portal` visas.
3. **Förväntat resultat:** Ingen skyddad data renderas förrän AAL2 uppnåtts, exakt enligt `lib/supabase/proxy.ts`s dokumenterade beteende.
4. **Verifiering:** Visuell kontroll i webbläsaren, eventuellt komplettera med Network-fliken för att se att `/api/admin/operativt` ger riktig data (inte 401) efter godkänd AAL2.
5. **Rollback:** Ej tillämpligt (läsverifiering, ingen skrivning).

## Kvarvarande framtidsfunktioner (inga blockerare)

- **Riktig personal-/teknikermodell**: klar och live sedan `6365ec6` — inget kvarvarande här.
- **Aviseringar / mottagare / kategorier / standardsvar** (`/portal/installningar`): medvetet läsläge tills serverlagring och e-postflöde beslutas. Tydligt markerat i UI ("Skrivning är avstängd här...").
- **Fil-nedladdning för ärendebilagor**: knapp finns, markerad `disabled` med tooltip "Filhämtning är inte tillgänglig ännu."

## Rollback-plan (helhet)

- **Kod:** `git revert` av valfri commit i listan ovan, eller `git reset --hard <tidigare-SHA>` + ny force-push efter godkännande (ej gjort automatiskt).
- **Deploy:** `wrangler rollback --name nova-it-admin` till föregående versions-ID (se `wrangler deployments list`).
- **Databas:** Inga destruktiva migrationer i detta pass — enda schemaändringen (`titel`/`aktiv` på `profiles`) är additiv och kräver ingen rollback-SQL.

## Slutbedömning

**CONDITIONAL GO** — all kod är redo (tester, lint, typecheck, build, OpenNext-build, dry-run och secret-list gröna; inga blockerande kod- eller driftsproblem hittades), men två manuella externa steg återstår innan skarp produktion kan bekräftas fullt ut:

1. Deploy av de tre senaste commits (kodändringar redan granskade och testade, men inte publicerade live).
2. Manuell AAL2-/webbläsarverifiering av en människa med riktiga kontouppgifter — kan inte utföras av mig.

GO kan inte användas förrän båda dessa är genomförda och bekräftade.
