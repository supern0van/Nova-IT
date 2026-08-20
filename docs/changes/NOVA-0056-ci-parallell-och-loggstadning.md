---
id: NOVA-0056
date: 2026-08-20
date_precision: day
type: infrastructure
status: completed
systems:
  - publik-webbplats
  - ci-cd
---

# CI: test/lint/typecheck/build parallella jobb, borttagna debug-loggar

## Vad ändrades?

- `.github/workflows/ci.yml` - kontrollerna `test`, `lint`, `typecheck` och
  `build` kördes tidigare som fyra sekventiella steg i EN job (`verify`),
  vilket gjorde total CI-väggklockstid till summan av alla fyra. De är
  oberoende av varandra (ingen behöver en annans output) och körs nu som
  fyra parallella jobb - väggklockstiden blir i stället den långsammaste
  enskilda kontrollens tid (normalt `build`), i praktiken en betydande
  minskning av tiden till grönt/rött CI-svar på en PR.
- `src/features/support/support-ai-server.ts` - tog bort två kvarvarande
  `console.log`-felsökningsrader ("Supportassistentens AI svarade") som
  loggade vid varje lyckat AI-anrop i produktion (Cloudflare Worker-loggar)
  - inte ett fel, bara brus som gjorde de riktiga felloggarna svårare att
  hitta i produktionsloggarna.

## Varför?

Del av en bredare hälsokontroll (lösa trådar, buggar, CI-hastighet,
inloggningshastighet) över hela kodbasen. Snabbare CI ger snabbare
återkoppling på varje PR utan att ändra vad som faktiskt kontrolleras.

## Resultat

Samma fyra kontroller körs, bara parallellt i stället för sekventiellt.
Ingen ändring i vad `bun run test`/`lint`/`typecheck`/`build` gör lokalt -
`ci.yml` orkestrerar dem annorlunda, koden de kör är oförändrad förutom de
borttagna loggraderna. Verifierat lokalt: `bun run test`/`lint`/`typecheck`/
`build` alla gröna.
