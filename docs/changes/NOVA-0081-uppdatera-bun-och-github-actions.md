---
id: NOVA-0081
date: 2026-10-03
date_precision: day
type: changed
status: completed
systems:
  - public-site
---

# Uppdatera Bun, GitHub Actions och i princip alla beroenden till senaste version

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
- **Major-uppgraderingar**, en i taget med egen felsökning mellan varje:
  - `lucide-react` 0.577.0 → 1.49.0 - ingen kodändring behövdes, alla
    importerade ikoner finns kvar under samma namn.
  - `react-day-picker` 9.14.0 → 10.0.2 - `src/components/ui/calendar.tsx`:
    `classNames`-nyckeln `table` döptes om till `month_grid` i v10:s
    `ClassNames`-typ.
  - `recharts` 2.15.4 → 3.10.1 - `src/components/ui/chart.tsx` (oanvänd
    shadcn-boilerplate, ingen route importerar den, men fixad för att inte
    lämna trasig kod): v3 separerar komponentens egna props
    (`RechartsPrimitive.Tooltip`) från render-props-formen som skickas till
    en custom `content`-funktion. Bytte till de nya exporterade typerna
    `TooltipContentProps` och `DefaultLegendContentProps`, samt ersatte en
    `key={item.dataKey}` (nu potentiellt en funktion, inte giltig som React
    `key`) med den redan beräknade lokala `key`-variabeln.
  - `zod` 3.25.76 → 4.6.5 - **ingen kodändring behövdes alls.** Körde
    dessutom manuellt `kontakt.tsx`:s formulärschema (custom
    felmeddelanden, `.superRefine`, `z.enum`) mot verkliga ogiltiga/giltiga
    indata för att verifiera att felmeddelanden och `issue.path` är
    identiska efter uppgraderingen - ingen test-fil täckte den filen.
  - `@vitejs/plugin-react` 5.2.0 → 6.1.1, `@types/node` 22.20.5 → 26.6.4,
    `globals` 15.15.0 → 17.13.0 - inga ändringar behövdes.

## Vad lämnades medvetet orört - och varför

- `typescript` 5.9.3 → 7.0.2: **blockerad, inte en avvägning.**
  `typescript-eslint` vägrar uttryckligen köra på TS 7.0 ("typescript-eslint
  does not support TS 7.0", kastar ett fel direkt vid lint-start) - se
  [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940).
  TS 7 är den nya Go-baserade kompilatorn (hoppar över 6.x helt); stannar på
  5.9.3 till typescript-eslint stödjer den.

## Varför?

Stefan bad om en genomgång av varenda tjänst/paket git/GitHub använder,
med installation av senaste version där det saknades - inklusive
major-uppgraderingarna, inte bara det som ryms inom befintliga semver-spann.

## Resultat

- `bun run typecheck`, `bun run lint` (0 fel) och `bun run test`
  (190 pass) gröna på Bun 1.4.2, med samtliga paket på senaste version
  utom `typescript` (blockerad av `typescript-eslint`, se ovan).
- `bun run build` grön (en ofarlig bundlarinfo om `"use client"`-direktiv
  i `@radix-ui/react-popper`, ingen build-fel).
- `bun audit --audit-level=high`: "No vulnerabilities found".
- `bun outdated` efter uppgraderingen visar bara `typescript` kvar, plus
  tre paket där Bun självt filtrerar bort en nypublicerad "senaste"
  version på grund av minimiålder (`lucide-react`, `react-resizable-panels`,
  `eslint` - redan på den version Bun anser vara den faktiska senaste).
- GitHub Actions-pinningarna verifierade mot verkliga commit-SHA:n via
  `git ls-remote --tags`, men den slutgiltiga valideringen av att de
  fungerar i runner-miljön sker först i CI för denna PR.

## Dokumentationspåverkan

Ingen.
