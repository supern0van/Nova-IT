---
id: NOVA-0052
date: 2026-08-20
date_precision: day
type: security
status: completed
systems:
  - publik-webbplats
---

# Integritetstexten om ärendeguidens AI, och en länk-XSS-risk i chatten

## Vad ändrades?

Två fynd från en bred kodgenomgång av hela hemsidan (mock/saknad/felaktig
kod), båda i den publika sitens supportfunktioner:

- `src/components/legal-dialog.tsx`: integritetstextens avsnitt
  "Automatisk sortering med AI" beskrev bara den strukturerade
  supportguidens enstaka klassificerings-/sammanfattningsanrop. Texten
  nämnde inte alls att ärendeguiden numera även har ett fritt
  chattläge (`SupportBot`/`SupportChat`, se `support-chat.ts`) som skickar
  hela den pågående konversationen (upp till 14 turer) till samma
  Cloudflare Workers AI-modell inför varje svar, tillsammans med Nova
  IT:s egna kunskapsbasdokument. Avsnittet är omdöpt till "Ärendeguidens
  AI" och skrivet om för att beskriva båda lägena korrekt.
  Versionsetikett och "senast uppdaterad"-datum uppdaterade.
- `src/features/support/chat/MessageBubble.tsx`: assistentens fritextsvar
  renderades med `ReactMarkdown` och tillät `"a"` (länkar) i
  `allowedElements`, öppnad i ny flik. Modellen har inget legitimt behov
  av att själv producera länkar - riktiga källhänvisningar renderas
  separat via `CitationChips`, med en hårdkodad `sourceUrl` från
  kunskapsbasen, aldrig från modellens egen text. `"a"` togs bort ur
  `allowedElements`.

## Varför?

Integritetstexten ska beskriva vad som faktiskt skickas vart, inte bara
den äldre, snävare AI-användningen. Den fria chatten är en väsentligt
större datamängd (hela konversationen, inte ett enda fält) och en annan
typ av AI-användning (en löpande dialog, inte en engångsklassificering)
än vad texten beskrev - en GDPR-transparensbrist.

Att tillåta modellgenererade länkar i chattens rendering öppnade en
promptinjektions-närliggande risk: lyckas en användare få modellen att
skriva ut en markdown-länk (t.ex. en phishing-url eller ett
`javascript:`-schema) skulle den renderas som en riktig, klickbar länk i
en yta som ser ut att komma från Nova IT.

## Resultat

Integritetstexten beskriver nu korrekt att ärendeguidens fria chatt
skickar hela konversationen till Cloudflare Workers AI vid varje svar.
Chattens assistentsvar kan inte längre innehålla klickbara länkar -
`unwrapDisallowed` gör att en eventuell länk i modellens text nu bara
visas som sin synliga text.

## Dokumentationspåverkan

Ingen ytterligare dokumentation i den här repon.
