---
id: NOVA-0063
date: 2026-08-24
date_precision: day
type: infrastructure
status: completed
systems:
  - publik-webbplats
---

# Tvärgående städning: tmp/-artefakter, dubblerad AI-runtime-kod, dependency-audit (Fas P2)

## Vad ändrades?

- `tmp/` lades till i `.gitignore`; elva incheckade PNG-artefakter
  (skärmdumpar/PDF-slides från ett tidigare granskningspass) togs bort.
- Dubblerad kod mellan `src/features/support/support-ai-server.ts` och
  `support-chat-server.ts` (bindningsuppslag mot `env.AI`, uppslag mot
  den delade AI-budgeten, timeout-hjälpare) bröts ut till en delad
  `support-ai-runtime.ts`.
- Nytt CI-jobb "Dependency audit" (`.github/workflows/ci.yml`) kör
  `bun audit` på varje push/PR - rapporterande, inte blockerande.

## Varför?

`tmp/` var inte ignorerat trots namnet, vilket lät engångsartefakter
smyga in i historiken. De två AI-server-filerna hade praktiskt taget
identisk kringkod kopierad i stället för delad - dyrt att hålla i synk
vid framtida ändringar. Dependabot var bara konfigurerat för
version-uppdateringar, inget fångade tidigare kända CVE:er i det låsta
beroendeträdet.

## Resultat

`bun run test` (133 test, oförändrat antal - refaktorn flyttar bara var
koden bor), `bun run lint` (0 fel), `bun run typecheck`, `bun run build`
- alla gröna. `bun audit`-jobbet syns nu i varje PR:s checks utan att
kunna blockera en merge.

## Dokumentationspåverkan

Ingen ytterligare dokumentation i den här repon.
