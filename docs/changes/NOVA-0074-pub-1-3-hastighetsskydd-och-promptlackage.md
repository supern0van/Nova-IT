---
id: NOVA-0074
date: 2026-09-13
date_precision: day
type: security
status: completed
systems:
  - public-site
---

# PUB-1–3: eget hastighetsskydd för supportchatt och kontaktformulär, filter mot läckt systemprompt

## Vad ändrades?

- **PUB-1**: supportchatten (`support-chat-server.ts`) kontrollerar nu ett
  eget, riktigt per-IP-hastighetsskydd - Cloudflares egen distribuerade
  `ratelimits`-bindning (`SUPPORT_CHAT_RATE_LIMITER`, 10 anrop/60s) - före
  den delade AI-budgeten. Ny UI-status `rate-limited`, skild från
  `session-limit` och `ai-unavailable`.
- **PUB-2**: `sanitizeReply` (`support-tools.ts`) filtrerar nu även svar som
  citerar eller läcker modellens egen systemprompt, inte bara
  felsökningsråd.
- **PUB-3**: kontaktformuläret/supportassistentens handoff
  (`contact-server.ts`) har fått ett eget, motsvarande per-IP-skydd
  (`CONTACT_FORM_RATE_LIMITER`, 5 anrop/60s), utöver Turnstile och
  adminportalens nedströms IP-spärr.
- PUB-4 (lazy-loading), PUB-5 (sitemap), PUB-6 (JSON-LD telephone) och
  PUB-7 (cookie-consent-toggles) kontrollerade mot aktuell kod: redan
  åtgärdade eller villkoret gäller inte för Nova IT idag.

## Varför?

Den fördjupade revisionen 2026-09-12 identifierade att chattens turtak var
ren klientstate (kringgås av en sidladdning) och att kontaktformuläret
saknade eget hastighetsskydd - båda kunde tömma den DELADE dagliga
AI-Neuron-budgeten eller driva spam. `sanitizeReply` skyddade bara mot ett
av flera sätt en modell kan avvika från sin avsedda roll.

## Resultat

Tre oberoende, kompletterande skyddslager (fail-open, sekundära till de
befintliga fail-closed-kontrollerna) adresserar de tre högst prioriterade
publika fynden från revisionen. `docs/supportassistent-ai-drift.md`
uppdaterad för att skilja det nya kodbaserade skyddet från den äldre
varningen om en manuell Worker-minnesräknare.

## Dokumentationspåverkan

`docs/supportassistent-ai-drift.md` uppdaterad i samma PR. Ingen annan.
