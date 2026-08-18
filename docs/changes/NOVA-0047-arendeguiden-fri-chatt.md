---
id: NOVA-0047
date: 2026-08-18
date_precision: day
type: changed
status: completed
systems:
  - publik-webbplats
---

# Bygg om Ärendeguiden till en fri, flerturs AI-supportchatt

## Vad ändrades?

Ärendeguidens primära upplevelse är inte längre den styrda kort/alternativ-
guiden med en tunn, enstaka AI-klassificering vid sidan om. Ny huvud-
komponent `SupportChat.tsx` (+ `chat/`-komponenter) för en riktig fri
konversation, ny motor `support-chat.ts`/`support-chat-server.ts` med
strömmande, flerturs Cloudflare Workers AI-anrop grundade i en ny, verklig
kunskapsbas (`support-knowledge.ts`) byggd av de befintliga ärendeflödena,
tjänsterna och FAQ:n. `SupportGuide.tsx` (den gamla guiden) tas inte bort -
den blir kvar som fallback-läge.

## Varför?

Den gamla AI-klassificeraren förde aldrig ett samtal, saknade verklig
kunskapsgrund i webbplatsens faktiska innehåll och kändes inte som en bra
supportupplevelse. Ägarens beslut: byt till fri chatt, med den starkast
möjliga motorn, och ett UI/UX inspirerat av etablerad praxis (Intercom Fin,
Zendesk AI m.fl.) - utan att tumma på de säkerhetsinvarianter den gamla
guiden byggde in.

## Resultat

- **Motor**: strukturerat svarskontrakt (`ChatSvar`) håller isär fri prosa
  (till kunden) och validerade fält appen agerar på (tjänsteområde,
  angelägenhet, citeringar, snabbsvarsförslag, säkerhetsflagga) - ersätter
  den gamla slutna `flowId`-whitelistens skydd med flera lager, dokumenterat
  medvetet svagare för fri text (se kommentarerna i `support-chat.ts`).
- Regelmotorns (`support-engine.ts`) nyckelordsbaserade säkerhetsspår körs
  alltid parallellt, både server- och klientsidan, och vinner alltid -
  modellen kan höja angelägenhetsgraden, aldrig sänka den
  (`resolveUrgency` i `support-tools.ts`).
- Egen flagga `SUPPORT_CHAT_LAGE` (separat från `SUPPORT_AI_LAGE`), samma
  fail-closed-mönster mot den delade `ai-budget`-tjänsten, nu med en vikt
  (`CHAT_BUDGET_VIKT`) som speglar att ett chattanrop kostar mer än en
  enstaka klassificering - se motsvarande utökning i
  `Nova-IT-Portaler/ai-budget`.
- Om AI:n är av, budgeten är slut eller första anropet misslyckas faller
  gränssnittet tillbaka till den oförändrade `SupportGuide.tsx`.
- **UI**: markdown-rendering (`react-markdown`, ny dependency), källhänvis-
  ningschips, AI-föreslagna snabbsvar (alltid vid sidan av fritext), en
  skrivindikator (nu ärlig eftersom det är en riktig AI-konversation),
  ord-för-ord-uppspelning av svar utan att lösa SSE genom TanStack Starts
  serverfunktioner, alltid synlig eskalering till människa som återanvänder
  `SupportHandoff` oförändrat, desktop-klick-utanför-för-att-stänga.
- Ingen maskot eller "online"-status - håller fast vid den tidigare
  medvetna antropomorfiserings-återhållsamheten (se NOVA-0038 och
  `docs/supportbot-3d-polish-report.md`).
- 133 tester gröna, typecheck och lint rena, produktionsbygge verifierat.

**Medvetet inte gjort i den här omgången** (kräver kontoåtkomst eller ett
affärsbeslut som inte kan fattas i kod):

- **Ingen Anthropic/Claude-koppling.** `docs/supportassistent-ai-drift.md`
  slår fast att Cloudflare Workers AI valdes för att undvika ett nytt
  biträdesavtal (DPA) mitt under en pågående granskning. Motorn kör vidare
  på en uppgraderad Cloudflare-modell (`llama-3.3-70b-instruct-fp8-fast`)
  istället.
- **Ingen Cloudflare Vectorize.** Kräver kontots deploy-behörighet.
  `support-knowledge.ts` gör lexikal hämtning över samma korpus, med ett
  gränssnitt (`hamtaRelevantaDokument`) som gör ett senare Vectorize-byte
  till en isolerad ändring.
- **Ingen kant-rate-limiting satt upp.** Redan dokumenterad förutsättning
  (se NOVA-0043/`docs/supportassistent-ai-drift.md`), nu ännu viktigare
  eftersom fri flerturs-chatt har en större missbruksyta än en enstaka
  klassificering. `SUPPORT_CHAT_LAGE` förblir av som standard tills regeln
  finns på plats.
- Ingen feedback-mekanism (tumme upp/ner) - lågprioriterat, kan läggas till
  separat senare.

## Dokumentationspåverkan

`Nova-IT-Portaler/ai-budget/src/rakna.ts` fick en motsvarande, bakåt-
kompatibel utökning (viktad reservation) - se den PR:ns eget changelog.
