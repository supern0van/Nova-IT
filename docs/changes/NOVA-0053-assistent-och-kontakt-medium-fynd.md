---
id: NOVA-0053
date: 2026-08-20
date_precision: day
type: fixed
status: completed
systems:
  - publik-webbplats
---

# Fem Medium-fynd i ärendeguiden och kontaktformuläret

## Vad ändrades?

Fem fynd från den breda kodgenomgången av hela hemsidan, samtliga i
supportchatten och kontaktflödet:

- `src/routes/tjanster.$slug.tsx` gav ett soft-404 för en ogiltig slug -
  sidan renderade en "hittades inte"-text men med en vanlig 200-status.
  Lade till en `loader` som kastar `notFound()`, så routern nu renderar
  rotens riktiga `notFoundComponent` med en korrekt 404-status.

- Citationernas källänkar var trasiga på två sätt: flödesdokumentens
  `sourceUrl` pekade på `/assistent#<flow-id>` trots att `/assistent`
  bara renderar chattwidgeten och aldrig haft något innehåll med de
  ankarna - bytt till flödets `serviceSlug` (`/tjanster/<slug>`), en
  riktig sida. FAQ-dokumentens `sourceUrl` pekade på `/faq#fraga-N`, men
  inget element på FAQ-sidan hade det id:t - lagt till `id={fraga-N}` på
  respektive `AccordionItem`.

- Citations-chippen (`CitationChip.tsx`) omnumrerade den filtrerade,
  bara-citerade dokumentlistan från 1 igen i stället för att visa
  modellens EGNA `[n]`-nummer (samma nummer som förekommer i svarstexten)
  - en text som sa "...enligt [3]" kunde visa en chip märkt "[1]". Numret
  följer nu med hela vägen från `citedDocIds` till renderingen.

- `support-chat-hook.ts` ökade tur-räknaren INNAN AI-anropet, och
  återställde den aldrig vid ett misslyckat anrop (AI nere, budget slut,
  nätverksfel) - en kund kunde tömma hela `MAX_TURNS` på enbart
  misslyckade försök utan att någonsin få ett riktigt svar. Räknaren
  minskas nu tillbaka vid ett misslyckat anrop.

- `kontakt.tsx`: om ärendeguidens chatt bad om att skicka med en
  konversation (`?form=request`) men `sessionStorage`-underlaget saknades
  eller inte gick att tolka (blockerad lagring, för kort kontaktorsak),
  landade kunden tyst på en helt tom formulärsida utan förklaring. Visar
  nu en kort notis om att beskriva ärendet igen. Skicka-knappen kunde
  också klickas innan Cloudflare Turnstile hunnit utfärda en token (ett
  race mellan widgeten och en snabb användare) - knappen är nu inaktiv
  tills en token finns.

## Varför?

Var och en är en verklig, om än begränsad, användarpåverkande brist: fel
HTTP-status för SEO/länkkontroll, döda länkar i en yta som ska bygga
förtroende, en felaktig källhänvisning som undergräver tilliten till
svaren, en tur-räknare som kan låsa ute en kund helt i onödan, och två
sätt att tappa kontext/skicka ett ogiltigt formulär utan att kunden får
veta det.

## Resultat

Alla fem fixade, verifierade med `bun run test` (133 test), `bun run
lint` (0 fel), `bun run typecheck` och `bun run build`.

## Dokumentationspåverkan

Ingen ytterligare dokumentation i den här repon.
