---
id: NOVA-0083
date: 2026-10-09
date_precision: day
type: security
status: completed
systems:
  - public-site
---

# Åtgärda seroval- och source-map-js-sårbarheterna i dependency audit

## Vad ändrades?

- `package.json`: lagt till overrides `"seroval": "1.6.8"` och
  `"source-map-js": "1.2.2"`.
- `bun.lock`: motsvarande resolutioner uppdaterade. Minimal ändring -
  ingen annan paketversion rörd.

## Varför?

`bun audit --audit-level=high` flaggade två nya high-fynd:

- `seroval` `<=1.6.2` ([GHSA-jp82-f5mq-hwhp](https://github.com/advisories/GHSA-jp82-f5mq-hwhp))
  - minnesuttömning via okontrollerad TypedArray-längd vid JSON-deserialisering,
  via `@tanstack/router-core` (TanStack Start/Router).
- `source-map-js` `>=1.0.0 <1.2.2` ([GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q))
  - DoS i event-loopen via indexerade source-map-sektionsoffsets, via
  `@tailwindcss/node` och `vite`/`postcss`.

Verifierat att felet är identiskt på `main` (samma `bun.lock`), så det
är inte orsakat av något annat ändringsförslag - en ren
beroendeuppdatering.

`seroval@1.6.9` (absolut senaste) blockerades av Buns egen
minimum-release-age-policy (för nypublicerad); `1.6.8` används i
stället, fortfarande väl inom `minimatch`/`@tanstack`-paketens
deklarerade `^1.6.2`-spann.

## Resultat

- `bun audit --audit-level=high`: "No vulnerabilities found".
- `bun run typecheck`, `bun run lint` (0 fel) och `bun run test`
  (190 pass) gröna. `bun run build` grön.
- Ingen runtime-kod ändras - ren dev-/byggberoendefix.

## Dokumentationspåverkan

Ingen.
