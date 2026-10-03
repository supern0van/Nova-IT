---
id: NOVA-0081
date: 2026-10-03
date_precision: day
type: changed
status: completed
systems:
  - public-site
---

# Uppdatera Bun, GitHub Actions och alla beroenden inom befintliga spann

## Vad ändrades?

- **Bun-runtimen**: `.bun-version` och `package.json`s `packageManager`
  höjda från `1.3.14` till `1.4.2` (senaste stabila). Lockfilen migrerades
  automatiskt till `lockfileVersion: 3`.
- **GitHub Actions**, pinnade om till senaste release (SHA + versionskommentar),
  verifierat mot `git ls-remote` för varje tagg:
  - `actions/checkout`: v4.4.0 → v7.0.1
  - `actions/cache`: v4.3.0 → v6.1.0
  - `actions/upload-artifact`: v4.6.2 → v7.0.1
  - `oven-sh/setup-bun`: redan på senaste (v2.2.0) - ingen ändring.
- **npm/bun-paket**: `bun update` körd - alla paket höjda till senaste
  version som ryms inom befintliga `^`-spann i `package.json` (ingen
  breaking change per semver). Bland annat `@tanstack/*`-familjen,
  `react-hook-form`, `tailwind-merge`, `eslint`, `typescript-eslint`,
  `vite` och en rad transitiva beroenden.
- `nitro` (exakt pinnad, inget `^`-spann eftersom paketet är en beta-kanal):
  höjd manuellt från `3.0.260603-beta` till `3.0.260903-beta`.

## Vad lämnades medvetet orört?

Följande har en *latest* som bryter mot paketets nuvarande major-version
och kräver egen migrering/testning innan de bör höjas - se separat
uppföljning:

- `zod` 3.25.76 → 4.6.5 (Zod v4 är en betydande omskrivning av schema-API:t;
  paketet används brett i kontakt-/statuskoll-/support-serverkoden)
- `recharts` 2.15.4 → 3.10.1
- `lucide-react` 0.577.0 → 1.49.0
- `react-day-picker` 9.14.0 → 10.0.2
- `@vitejs/plugin-react` 5.2.0 → 6.1.1
- `@types/node` 22.20.5 → 26.6.4
- `globals` 15.15.0 → 17.13.0
- `typescript` 5.9.3 → 7.0.2 (den nya Go-baserade kompilatorn; inte en
  trivial patch-uppgradering)

## Varför?

Stefan bad om en genomgång av varenda tjänst/paket git/GitHub använder,
med installation av senaste version där det saknades. Uppdelat i ett säkert
steg (allt som ryms inom befintliga semver-spann, inklusive CI-verktyg) och
en separat lista över major-uppgraderingar som kräver manuell granskning,
för att inte riskera att tyst göra produktionssiten trasig.

## Resultat

- `bun run typecheck`, `bun run lint` (0 fel) och `bun run test`
  (190 pass) gröna på Bun 1.4.2.
- `bun run build` grön (en ofarlig bundlarinfo om `"use client"`-direktiv
  i `@radix-ui/react-popper`, ingen build-fel).
- `bun audit --audit-level=high`: "No vulnerabilities found".
- GitHub Actions-pinningarna verifierade mot verkliga commit-SHA:n via
  `git ls-remote --tags`, men den slutgiltiga valideringen av att de
  fungerar i runner-miljön sker först i CI för denna PR.

## Dokumentationspåverkan

Ingen.
