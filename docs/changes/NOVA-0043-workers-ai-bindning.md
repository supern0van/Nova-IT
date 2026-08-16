---
id: NOVA-0043
date: 2026-08-16
date_precision: day
type: security
status: completed
systems:
  - publik-webbplats
---

# Native Workers AI-bindning i stället för REST med API-token

## Vad ändrades?

`support-ai-server.ts` prövar nu Cloudflare Workers AI-bindningen (`env.AI`)
först. Bindningen kräver ingen hemlighet - Cloudflare autentiserar Workern mot
Workers AI internt. REST-vägen med `CLOUDFLARE_ACCOUNT_ID`/
`CLOUDFLARE_AI_TOKEN` finns kvar oförändrad som fallback när bindningen inte
hittas, vilket är det normala läget i lokal `vite dev`.

Bindningen deklareras i `vite.config.ts` via
`nitro({ cloudflare: { wrangler: { ai: { binding: "AI" } } } })`, som mergas
in i det byggenererade `.output/server/wrangler.json` utan att röra någon
annan nyckel - verifierat genom att bygga och jämföra hela filen mot
föregående version.

Bindningen läses via `getRequest()` från `@tanstack/react-start/server`, men
INTE som ett statiskt top-level-import - `support-ai-server.ts` importeras
även från `SupportGuide.tsx` (klientkod, för RPC-anropet), och ett statiskt
import av server-entrypointen stoppades av `importProtection` i
`vite.config.ts` (samma skydd som infördes i NOVA-0041). Fixen är att slå in
åtkomsten i `createServerOnlyFn`, med en dynamisk import inuti - exakt det
mönster TanStack Start själv föreslår för den situationen.

## Varför?

REST-vägen krävde en API-token som en produktionshemlighet, trots att Workers
AI körs i samma Cloudflare-konto som Workern själv. Bindningen tar bort den
hemligheten helt för normal drift.

## Resultat

`.output/server/wrangler.json` innehåller nu `"ai": { "binding": "AI" }` och
är i övrigt identisk med tidigare bygge. Klientbundeln innehåller fortfarande
RPC-anropet till `klassificeraMedAi` men inget av `getRequest` eller
server-entrypointen - verifierat genom att grepa `.output/public/` efter
bygget. En verklig rundtripp i `vite dev` (`_serverFn`-anropet) svarar 200 utan
fel. 86 tester gröna, inklusive fyra nya för bindningsvägen.

**Inte verifierat:** att bindningen faktiskt löses korrekt i en skarp
Cloudflare-deploy, eftersom det hade krävt `wrangler dev --remote` mot ett
riktigt konto från utvecklingsmiljön. REST-fallbacken finns kvar just av det
skälet - se `docs/supportassistent-ai-drift.md` för hur man bekräftar
bindningsvägen efter första skarpa aktivering.

## Dokumentationspåverkan

`docs/supportassistent-ai-drift.md` beskriver nu båda anropsvägarna,
prioritetsordningen och hur man i efterhand bekräftar vilken väg som
faktiskt används.
