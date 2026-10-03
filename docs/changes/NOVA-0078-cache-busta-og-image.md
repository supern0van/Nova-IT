---
id: NOVA-0078
date: 2026-10-03
date_precision: day
type: fixed
status: completed
systems:
  - public-site
---

# Cache-busta og:image med byggversion

## Vad ändrades?

- Ny `src/lib/site-meta.ts` som exporterar `siteUrl` och en versionerad
  `socialImageUrl` (`?v=<kort git-sha>` på bildens URL).
- Versionen sätts via Vite `define` i `vite.config.ts`, från `GITHUB_SHA` i
  CI (faller tillbaka på `"dev"` lokalt), så URL:en ändras vid varje deploy.
- Tog bort tolv dupliceringar av `siteUrl`/`socialImageUrl`-konstanterna som
  fanns spridda över routes och `structured-data.ts` - allt pekar nu på
  samma källa.

## Varför?

Delade länkar till nova-it.se visade en gammal förhandsvisning (titel,
beskrivning, bild) på plattformar som Facebook, LinkedIn och Slack. Sidan
själv serverar inte gammal HTML - inga `Cache-Control`-headers på
SSR-svaren, och `og:*`-taggarna var redan aktuella. Orsaken är att dessa
plattformar cachar en länks `og:image` under obestämd tid, nyckladt enbart
på URL:en. Eftersom bild-URL:en var statisk (`/nova-it-workspace.png`) för
alla sidor fastnade de på den allra första skrapningen.

## Resultat

- Framtida ändringar av förhandsvisningsbilden eller -texten tvingar
  plattformarna att skrapa om, i stället för att tyst fastna på en gammal
  version.
- Löser inte redan cachade förhandsvisningar - det kräver manuell
  omskrapning (t.ex. Facebooks Sharing Debugger).
- `bun run typecheck`, `bun run lint` (0 fel) och `bun run test` (190 pass)
  gröna. Verifierat med `GITHUB_SHA=abcdef1234567890 bun run build` att
  `?v=abcdef1` faktiskt hamnar i den byggda outputen.

## Dokumentationspåverkan

Ingen.
