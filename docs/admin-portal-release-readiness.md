# Adminportal — slutgiltig release-readiness (2026-07-28)

## Utgångsläge

```
HEAD:           26fd26f (main, origin/main, origin/HEAD)
Arbetsyta:      ren, inget diff mot HEAD
Senast deploy:  version 5e735ced-52c4-46f3-9a93-2c0da3856302, 2026-07-28 (efter detta pass)
                Live-Workern matchar nu HEAD (26fd26f) — se "Deploy" nedan.
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
| 2 | AAL1-session nekas skyddat innehåll | **VERIFIERAD** (kod/test) · **Bekräftad av användaren** (levande webbläsarsession, ej utförd av Claude) | `proxy.test.ts` ("aal1 skickas till /mfa, inte in i portalen"), `route-anvandare.test.ts`. Den levande webbläsarverifieringen kräver ett riktigt konto och har bekräftats av kontoägaren själv — Claude anger aldrig lösenord/TOTP och har inte utfört den delen personligen. |
| 3 | Full AAL2-session ger åtkomst | **VERIFIERAD** (kod/test) · **Bekräftad av användaren** (levande webbläsarsession, ej utförd av Claude) | `proxy.test.ts` ("aal2 släpps igenom"), `mfa.test.ts`. Samma begränsning som ovan — bekräftad av kontoägaren, inte av Claude. |
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

## Manuella åtgärder — status

### 1. Deploy till produktion — ✅ GENOMFÖRD

Deployad från WSL (`~/nova-it/portal`, `pnpm run deploy:production`) efter push av `26fd26f` till `origin/main`.

- **Ny version:** `5e735ced-52c4-46f3-9a93-2c0da3856302`, publicerad på alla fyra custom domains.
- **Verifiering:** `node scripts/smoke-worker.mjs` grönt igen (alla 4 domäner: 307 → `/logga-in`, samtliga API:er 401 med tomma svar). Dessutom visuellt bekräftat i webbläsaren att en obefintlig URL nu ger den nya svenska 404-sidan ("Sidan hittades inte") i stället för Next.js standardsida — direkt bevis på att den nya koden är live, inte bara en ombyggd kopia av det gamla.
- **Rollback vid behov:** `wrangler rollback --name nova-it-admin` till föregående version `d81ccba0-a958-425f-90eb-580ad846d2ce`.

### 2. Manuell AAL2- och webbläsarverifiering — ✅ BEKRÄFTAD AV ANVÄNDAREN

Kontoägaren har bekräftat att detta är genomfört. Claude anger aldrig lösenord eller TOTP-koder åt användaren och har därför inte utfört själva inloggningsflödet personligen — den bekräftelsen kommer från kontoägaren, dokumenterat här för spårbarhet.

## Kvarvarande framtidsfunktioner (inga blockerare)

- **Riktig personal-/teknikermodell**: klar och live sedan `6365ec6` — inget kvarvarande här.
- **Aviseringar / mottagare / kategorier / standardsvar** (`/portal/installningar`): medvetet läsläge tills serverlagring och e-postflöde beslutas. Tydligt markerat i UI ("Skrivning är avstängd här...").
- **Fil-nedladdning för ärendebilagor**: knapp finns, markerad `disabled` med tooltip "Filhämtning är inte tillgänglig ännu."

## Rollback-plan (helhet)

- **Kod:** `git revert` av valfri commit i listan ovan, eller `git reset --hard <tidigare-SHA>` + ny force-push efter godkännande (ej gjort automatiskt).
- **Deploy:** `wrangler rollback --name nova-it-admin` till föregående versions-ID (se `wrangler deployments list`).
- **Databas:** Inga destruktiva migrationer i detta pass — enda schemaändringen (`titel`/`aktiv` på `profiles`) är additiv och kräver ingen rollback-SQL.

## Slutbedömning

**GO** — skarpt redo.

Samtliga sex GO-villkor uppfyllda:

1. All adminfunktionalitet är verklig — kunder/ärenden/bokningar/personal läses och skrivs mot riktiga Supabase-tabeller (`admin_kunder`, `admin_arenden`, `admin_bokningar`, `public.profiles`), verifierat i kod, tester och live-schema.
2. Inga produktionsflöden är demo-/localStorage-baserade — explicit testat (`store.test.ts`, `use-operativ-admin-data.test.tsx`).
3. Säkerhetskontrollerna är verifierade — AAL2 fail-closed, behörighetsgating per roll, RLS/grants/SECURITY DEFINER-härdning, generiska felresponser.
4. Tester/build/typecheck/lint passerar — 51 filer/366 tester, lint, tsc, `pnpm build`, OpenNext-build och `wrangler deploy --dry-run` alla gröna.
5. Cloudflare-konfigurationen är verifierad — Worker-namn, domäner, secrets (namn only), HSTS, TLS-cert, ingen konfigurationskonflikt.
6. Manuell AAL2- och webbläsarkontroll är genomförd — bekräftad av kontoägaren.

Deploy är genomförd och verifierad live (version `5e735ced-52c4-46f3-9a93-2c0da3856302`). Inga blockerande kod- eller driftsproblem kvarstår.
