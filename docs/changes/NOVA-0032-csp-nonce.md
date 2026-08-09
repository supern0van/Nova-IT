---
id: NOVA-0032
date: 2026-08-09
date_precision: day
type: security
status: completed
systems:
  - public-site
---

# Nonce-baserad CSP i stället för script-src 'unsafe-inline'

## Vad ändrades?

`script-src` i Content-Security-Policy använder nu en unik, slumpmässig nonce per request (`'nonce-<64-bitars-hex>'`) i stället för `'unsafe-inline'`. `src/router.tsx` genererar nonce:n server-side per SSR-anrop (`createIsomorphicFn().server(...)`, `crypto.getRandomValues`) och skickar den till routern via `ssr: { nonce }`. `src/routes/__root.tsx` läser tillbaka samma värde i en `headers()`-funktion på root-routen och sätter CSP-headern där - det är där TanStack Start faktiskt har request-specifik `ssr.nonce` tillgänglig. `src/server.ts` behåller den gamla policyn (med `'unsafe-inline'`) enbart som reserv för svar som aldrig går genom root-routen (redirects, det egna felsidefallet).

## Varför?

Gammal TODO i `src/server.ts` sedan portalarbetet: `script-src 'unsafe-inline'` behövdes eftersom TanStack Start serialiserar bootstrap-/router-state som inline-scripts, och CSP:n inte hade nonce-stöd att tillgå. Verifierade mot TanStack Router-projektets egen CSP-e2e-testapp (`e2e/react-start/csp` i `TanStack/router`-repot) att `ssr.nonce` + root-routens `headers()` är den avsedda, dokumenterade lösningen - och att vår installerade version (`@tanstack/react-router` 1.168.34) redan stödjer det.

## Resultat

Verifierat mot en Worker version-preview (ej produktionstrafik): unik nonce per request i både CSP-header och de faktiska inline-scripttaggarna, ingen hydreringskrasch. `style-src 'unsafe-inline'` är oförändrad - gäller inline `style`-attribut, som nonce inte täcker.

## Dokumentationspåverkan

Ingen.
