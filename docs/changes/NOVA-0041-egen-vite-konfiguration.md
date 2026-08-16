---
id: NOVA-0041
date: 2026-08-16
date_precision: day
type: infrastructure
status: completed
systems:
  - publik-webbplats
---

# Egen Vite-konfiguration i stället för Lovables byggwrapper

## Vad ändrades?

`@lovable.dev/vite-tanstack-config` är borttaget ur `devDependencies`.
`vite.config.ts` gick från tre rader till en uttrycklig konfiguration som
sätter upp Tailwind, tsconfig-paths, TanStack Start, nitro och React-pluginet
direkt.

Allt wrappern gjorde för produktionsbygget är överflyttat, i samma
pluginordning. Två detaljer som annars hade försvunnit tyst är särskilt
kommenterade i filen:

- **`importProtection`** — ett byggtidsskydd som får bygget att fela om
  klientkod importerar från `**/server/**` eller `server-only`. Det är en
  säkerhetsgräns, inte en stilregel: utan den kan en felaktig import dra in
  serverkod, och därmed hemligheter som `INTAG_SECRET` eller
  `RESEND_API_KEY`, i webbläsarbundlen.
- **`defaultPreset: "cloudflare-module"`** — inte `preset`. `defaultPreset` är
  ett fallback som Cloudflare Workers Builds och `NITRO_PRESET` fortfarande kan
  överrida, medan `preset` hade låst bygget hårt.

Följande är medvetet inte överflyttat, eftersom det bara tjänade
Lovable-editorn och inte produktionsbygget: `lovable-tagger`,
`vite-plugin-dev-server-bridge`, `vite-plugin-hmr-gate` och
`@tanstack/devtools-vite`.

`.lovable/project.json` och den inerta felrapporteringsshimmen i
`src/integrations/lovable/` är kvar som referens.

## Varför?

Hela byggkonfigurationen låg bakom ett tredjepartspaket. Det gjorde bygget
svårt att läsa och granska, och det blockerade konkret arbete: Cloudflare
Workers AI-bindningen (`env.AI`) kräver ändringar i nitro-konfigurationen,
vilket inte gick att göra genom wrappern. Därför anropas Workers AI i dag över
REST med en API-token i stället för genom en bindning.

## Resultat

`.output/server/wrangler.json` är **bit-för-bit identisk** med den wrappern
genererade, och nitro-presetet är fortfarande `cloudflare-module`. Bygget,
testerna, lint och typecheck är gröna, och inga hemligheter förekommer utanför
`.output/server`.

Ett första försök satte `cloudflare: { nodeCompat, deployConfig }` som wrappern
gör i sin sandbox-gren, men utelämnade `defaultPreset`. Bygget föll då tillbaka
på `node-server`, producerade ingen `wrangler.json` alls och hade inte gått att
deploya som Worker. Felet fångades genom att jämföra byggutdata mot en sparad
baslinje — inte av att bygget misslyckades, för det gjorde det inte.

## Dokumentationspåverkan

Ingen. Bygg- och deploykommandon är oförändrade.
