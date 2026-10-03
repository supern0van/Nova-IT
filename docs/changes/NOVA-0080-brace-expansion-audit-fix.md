---
id: NOVA-0080
date: 2026-10-03
date_precision: day
type: security
status: completed
systems:
  - public-site
---

# Åtgärda brace-expansion-sårbarheten i dependency audit

## Vad ändrades?

- `package.json`: `overrides["brace-expansion@^5.0.0"]` höjd från `5.0.9`
  till `5.0.12`.
- `bun.lock`: motsvarande resolution och sha512-hash uppdaterad till
  `brace-expansion@5.0.12`. Ingen annan paketversion rörd - verifierat med
  `bun install --frozen-lockfile` att alla 550 paket installeras identiskt
  förutom denna enda rad.

## Varför?

`bun audit --audit-level=high` flaggade två high-fynd i `brace-expansion`
([GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7),
[GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p)) -
DoS via okontrollerad rekursion - via `eslint` och `typescript-eslint`:s
transitiva `minimatch`-beroende. En tidigare override (från
`growth`/`fix`-arbetet i augusti) pinnade `brace-expansion` till `5.0.9`
som då var patchad, men en nyare advisory täcker även den versionen;
fixen kräver `>=5.0.11`.

## Resultat

- `bun audit --audit-level=high`: "No vulnerabilities found".
- `bun run typecheck`, `bun run lint` (0 fel) och `bun run test`
  (190 pass) gröna. `bun run build` grön.
- Ingen runtime-kod ändras - ren dev-beroendefix.

## Dokumentationspåverkan

Ingen.
