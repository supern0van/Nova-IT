---
id: NOVA-0075
date: 2026-09-13
date_precision: day
type: fixed
status: completed
systems:
  - public-site
---

# Bred analytisk granskning: a11y-svep i CI, /arendestatus-krasch fixad, lintstädning

## Vad ändrades?

- **Bugg (fångad indirekt av det nya a11y-svepet nedan):** `/arendestatus`
  kraschade i dev-läge (`Import denied in client environment` från Vites
  `importProtection`) eftersom `hamtaBesokarensIp` i
  `case-status-server.ts` var en vanlig `async function` med ett rått
  dynamiskt `import("@tanstack/react-start/server")`, i stället för
  `createServerOnlyFn` som samma mönster använder överallt annars
  (`support-ai-runtime.ts`, `contact-ratelimit.ts`). Ett literalt dynamiskt
  `import()` räcker inte för att undvika `importProtection` - Vite följer
  det statiskt precis som en vanlig import. Fixat genom att wrappa
  funktionen i `createServerOnlyFn`, samma mönster som resten av kodbasen.
- **Nytt:** `e2e/tillganglighet.spec.ts` - automatiserat axe-core-svep
  (WCAG 2.0/2.1 A+AA) över samtliga publika sidor, som en del av det
  befintliga E2E-flödet (`.github/workflows/e2e.yml`: push till main +
  nattlig cron). Detta var svepet som upptäckte ovanstående krasch (Vites
  felöverlägg registrerades av axe som en tangentbords-otillgänglig
  scrollbar region).
- Ny beslutslogg-post `DEC-0007` i `docs/DECISIONS.md`: motiverar varför
  `arChattIpSparrad`/`arKontaktformularIpSparrad`s fail-open-design är
  medveten (sekundärt skydd bakom en fail-closed spärr), inte en lucka.
- Lintstädning: `eslint --fix`/`prettier --write` tog bort 21 av 51
  lintvarningar (ren formattering). Kvarvarande 30 är samtliga
  `react-refresh/only-export-components` - TanStack Routers avsedda
  mönster (route-filer exporterar både `Route` och komponenten), inte
  verkliga kodkvalitetsbrister.

## Varför?

En bred, oberoende granskning av hela repot (kod, säkerhet, prestanda,
SEO, tillgänglighet, CI/CD) identifierade avsaknad av automatiserad
tillgänglighetskontroll som den enda punkten värd att åtgärda direkt -
`docs/project-status.md` efterfrågade redan detta i sin roadmap. Att bygga
och köra svepet avslöjade i sin tur en verklig, tidigare okänd krasch på
`/arendestatus` i dev-läge.

## Resultat

- `bun run test` (166/166), `bun run typecheck`, `bun run lint` (0 fel)
  och det nya `e2e/tillganglighet.spec.ts` (11/11 sidor) är alla gröna.
- `/arendestatus` fungerar nu i dev-läge utan krasch.
- Framtida PR:ar som råkar introducera vanliga WCAG-brister
  (kontrastfel, saknad label, felaktig ARIA) fångas automatiskt innan de
  når produktion, i stället för att bero enbart på manuell granskning.

## Dokumentationspåverkan

Ingen ytterligare - `docs/DECISIONS.md` (DEC-0007) uppdaterad i samma PR.
