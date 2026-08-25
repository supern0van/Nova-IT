---
id: NOVA-0068
date: 2026-08-25
date_precision: day
type: added
status: completed
systems:
  - publik-webbplats
---

# E2E-täckning (Playwright) för kontaktformuläret

## Vad ändrades?

- Nytt dev-beroende `@playwright/test`.
- `playwright.config.ts` - startar `bun run dev` mot en fast port, ett
  enda worker/inte parallellt (se filens kommentar om en Vite dev-
  kallstartsrace där tidiga requests kan träffa ett 503-fönster innan
  Nitro-miljön hunnit värmas upp), Turnstile körs mot Cloudflares
  officiella "alltid giltig"-testnyckel (riktig nätverkstrafik till
  challenges.cloudflare.com, ingen mockning av Turnstile).
- `e2e/kontaktformular.spec.ts` - fem tester för `/kontakt?form=request`:
  klientvalidering, honeypot-fältets dolda tillstånd, ärendesammanfattningen,
  "Ändra uppgifter", och ett regressionstest för Turnstile-retry-fixen
  (NOVA-0066, fynd #1) - verifierar att en NY token begärs efter ett
  misslyckat inskick i stället för att återanvända den förbrukade.
  `submitContactRequest`-anropet mockas via `page.route()` (identifierat
  genom att avkoda TanStack Starts `/_serverFn/<base64(json)>`-URL:er) -
  testerna skapar aldrig riktiga ärenden i adminportalen.
- `e2e/tsconfig.json` - separat, lätt tsconfig för E2E-filerna (huvud-
  tsconfig.json inkluderar bara `src/**`).
- Nytt CI-workflow `.github/workflows/e2e.yml` - körs INTE på pull_request
  (ett Playwright-jobb lägger normalt 2-5 extra minuter, vilket hade
  bromsat PR-feedback-loopen), bara på push till main och en nattlig
  schemalagd körning (02:00 UTC) plus manuell `workflow_dispatch`.
- Nya scripts: `bun run e2e`, `bun run typecheck:e2e`.
- `.gitignore`: `test-results/`, `playwright-report/`, `blob-report/`.

## Varför?

Flaggat som utanför scope i en tidigare testtäckningsfas (bara
komponent-/renderingstester då). Kontaktformuläret är sajtens viktigaste
konverteringsyta och den mest komplexa - värt en riktig
end-till-slut-täckning, inte bara isolerade enhetstester.

## Resultat

`bun run e2e` - 5/5 gröna lokalt. `bun run typecheck:e2e` - rent.
Huvudsviten (`bun run ci`) opåverkad - E2E är helt separat från
test/lint/typecheck/build-jobben i ci.yml.

## Dokumentationspåverkan

Ingen ytterligare dokumentation i den här repon.
