---
id: NOVA-0057
date: 2026-08-20
date_precision: day
type: infrastructure
status: completed
systems:
  - ci-cd
---

# CI: cacha Vite/Nitro-byggcachen mellan körningar

## Vad ändrades?

`.github/workflows/ci.yml` - lade till `actions/cache` för
`node_modules/.vite` och `.nitro` i Build-jobbet, nyckel på lockfile- +
källkodshash med `restore-keys`-fallback till senaste cachen för samma
lockfile-generation.

## Varför?

Del av samma bredare hälsokontroll som NOVA-0056 (CI-hastighet). Sparar
tidigare kompilerad output mellan CI-körningar i stället för en helt kall
build varje gång.

## Resultat

Ren CI-workflow-ändring, ingen kodpåverkan. YAML validerat.
