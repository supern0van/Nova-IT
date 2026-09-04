---
id: NOVA-0071
date: 2026-09-04
date_precision: day
type: infrastructure
status: completed
systems:
  - publik-webbplats
---

# Cachad kundportals-Turnstile-nyckel i portalpanelen

## Vad ändrades?

- `portal-turnstile-server.ts`: `getKundportalTurnstileSiteKey` (anropas
  av `TurnstileWidget` varje gång `PortalMeny` monterar den, dvs. varje
  gång en besökare öppnar inloggningspanelen i sajt-headern) cachar nu
  ett lyckat svar i 5 minuter i en modul-nivå-variabel (Worker-isolatet),
  samma sorts mönster som `scriptLoadPromise` i `turnstile-widget.tsx`.
  Ett misslyckat anrop cachas aldrig, så nästa öppning försöker direkt
  igen i stället för att vänta ut TTL:en.
- Den faktiska hämtnings-/cachningslogiken bröts ut till en egen
  exporterad funktion (`hamtaKundportalTurnstileSiteKey`), samma mönster
  som `sokArendestatus`/`lookupCaseStatus` i `case-status-server.ts`, så
  den går att enhetstesta utan `createServerFn`s server-runtime-kontext.

## Varför?

Del av en tredje optimeringsrunda över hela Nova IT-ekosystemet.
`PortalMeny` sitter i den sajt-övergripande headern (`site-chrome.tsx`)
och renderar alltså på varje sida. Utan cache gjorde varje öppning av
inloggningspanelen ett helt nytt Worker-till-Worker-anrop mot
adminportalens `/api/public/turnstile-config` för att hämta en site key
som i praktiken är statisk under hela deployen - en besökare som öppnar/
stänger panelen flera gånger (ångrar sig, klickar bort, öppnar igen för
att fylla i lösenord) upprepade fetchen helt i onödan.

## Resultat

Tar bort en onödig cross-Worker-nätverksrundtripp (typiskt 50-200 ms)
varje gång en besökare öppnar panelen mer än en gång per session,
minskar belastningen på adminportalens `/api/public/turnstile-config`,
och gör panelen kännas snabbare att öppna andra och tredje gången. Inget
externt kontrakt ändras.

`bun run ci` (test + lint + typecheck + build): grönt, bortsett från ett
sedan tidigare bekräftat förhandsbefintligt, obesläktat flaky Workers
AI-testfel i `support-chat-server.test.ts` (samma fel uppstår identiskt
på `main` utan dessa ändringar).

## Dokumentationspåverkan

Ingen ytterligare dokumentation i den här repon.
