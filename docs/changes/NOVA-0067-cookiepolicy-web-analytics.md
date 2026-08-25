---
id: NOVA-0067
date: 2026-08-25
date_precision: day
type: fixed
status: completed
systems:
  - publik-webbplats
---

# Cookiepolicytexten stämmer nu med den faktiska CSP-konfigurationen

## Vad ändrades?

`src/components/legal-dialog.tsx`s kakpolicy-avsnitt nämner nu Cloudflare
Web Analytics (kakolös, ingen personlig identifierbar information, inget
samtyckeskrav enligt IMY:s vägledning) i stället för att påstå att inga
externa analysverktyg alls används.

## Varför?

En granskning (2026-08-25, fynd #4) hittade att `src/server.ts` och
`src/routes/__root.tsx` explicit tillåter Cloudflare Web Analytics-beacon:en
(`static.cloudflareinsights.com`) i CSP:n - texten i kakpolicyn motsade
det. Stefan bekräftade att Web Analytics faktiskt är påslaget och ska
förbli det.

## Resultat

`bun run typecheck`/`lint`/`test` (142 test, oförändrat)/`build` - alla
gröna.

## Dokumentationspåverkan

Ingen ytterligare dokumentation i den här repon.
