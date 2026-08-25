---
id: NOVA-0066
date: 2026-08-25
date_precision: day
type: bugfix
status: completed
systems:
  - publik-webbplats
---

# Kontaktformulärets Turnstile-token-loop + fyra mindre fynd (ny granskningsomgång)

## Vad ändrades?

- `TurnstileWidget` (`src/components/turnstile-widget.tsx`) exponerar nu
  ett imperativt `reset()`-handtag via `forwardRef`/`useImperativeHandle`.
  Kontaktformuläret (`src/routes/kontakt.tsx`) anropar det och nollställer
  `turnstileToken` i sitt catch-block när ett inskickningsförsök
  misslyckas - Turnstile-tokens är engångsanvändbara, så utan detta
  skickades samma redan förbrukade token med vid varje omförsök, vilket
  garanterat misslyckades igen. Kunden fastnade och behövde ladda om
  sidan.
- `src/features/support/support-chat-hook.ts`: `turerRef`-räknaren
  dekrementeras nu även i `.catch()`-grenen (bara det kontrollerade
  `{ok:false}`-fallet gjorde det tidigare) - ett faktiskt nätverksfel gav
  kunden inget svar heller och ska inte kosta en tur av `MAX_TURNS`.
- `src/lib/error-capture.ts`: dokumenterat en känd begränsning (delad
  modulnivå-state kan i teorin korsförorenas mellan samtidiga requests i
  samma Worker-isolate) - bedömdes som acceptabelt för sitt syfte
  (bästa-möjliga-loggning), men flaggat tydligt i koden.
- `src/features/support/support-ai-runtime.ts`: `medTimeout()` fångar nu
  en sen rejection från den förlorande sidan av timeout-racet, så den
  inte syns som en unhandled rejection i Workers-loggarna.
- `src/components/site-chrome.tsx`: mobilmenyns Escape-hantering
  återställer nu fokus till hamburgerknappen, samma mönster som
  `PortalMeny` redan använde.

## Varför?

En ny bakgrundsgranskning (samma metod som gav Fas P1-P3, PR #112-114)
hittade sex nya fynd. Turnstile-loopen var det enda High-fyndet - en
verklig, reproducerbar dead-end för besökare vars första inskick
misslyckades av vilken anledning som helst. De övriga fem är mindre
robusthets-/tillgänglighetsfynd som är billiga att fixa i samma svep.

## Resultat

`bun run typecheck`, `bun run lint` (0 fel), `bun run test` (142 test,
oförändrat antal), `bun run build` - alla gröna.

## Dokumentationspåverkan

Ingen ytterligare dokumentation i den här repon.
