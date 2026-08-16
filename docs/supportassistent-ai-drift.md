# Supportassistentens AI-stöd — drift, kostnad och risk

Gäller `src/features/support/support-ai.ts` och `support-ai-server.ts`.
Senast uppdaterad: 2026-08-16.

## Vad AI-stödet gör, och inte gör

AI-stödet är ett **tillägg** till den regelbaserade motorn i
`support-engine.ts`, aldrig en ersättning. Ordningen är:

1. Regelmotorn kör lokalt i webbläsaren och svarar direkt. Kunden ser sitt
   resultat utan att vänta på något nätverksanrop.
2. AI:n körs parallellt server-side. Om den landar i ett **annat** område än
   regelmotorn visas det som en fråga till kunden: "Om jag förstår dig rätt…
   Vill du byta till det området?"
3. Kunden bestämmer. Området byts aldrig automatiskt.

Om AI-stödet är avstängt, felkonfigurerat, långsamt eller svarar med något
ogiltigt händer ingenting alls — guiden fungerar exakt som utan det.

## Varför Cloudflare Workers AI och inte OpenAI, Anthropic eller Google

Avgörande skäl är **dataskydd, inte pris**: Cloudflare är redan Nova IT:s
personuppgiftsbiträde för webbdriften. Workers AI innebär därför inget nytt
biträde att teckna avtal med, och kundens text lämnar inte en leverantör som
redan behandlar trafiken. Att i stället välja OpenAI, Anthropic eller Google
hade krävt ett nytt biträdesavtal, en ny leverantörsbedömning och en ny
tredjelandsbedömning — mitt under en pågående granskning.

Googles fria nivå har dessutom visat sig instabil; dygnskvoten för Gemini 2.5
Flash skars vid ett tillfälle från cirka 250 till cirka 20 anrop. Att bygga
kundbemötande på en kvot som kan ändras över en natt är inte rimligt.

## Kostnad

Cloudflare ger **10 000 Neurons per dygn utan kostnad**, återställs 00:00 UTC.
Räknat på cirka 900 tokens in och 120 ut per klassificering:

| Modell | Neurons per samtal | Gratis samtal per dygn |
| ------ | ------------------ | ---------------------- |
| Llama 3.2 3B (standard) | ~7,8 | ~1 280 |
| Granite 4.0 Micro | ~2,6 | ~3 800 |

Över taket kostar det 0,011 USD per 1 000 Neurons på Workers Paid.

## Missbruksrisk — måste hanteras före aktivering

Endpointen är **publik och oautentiserad**, precis som guiden i övrigt. Det
betyder att någon kan anropa den upprepat och antingen bränna dygnskvoten
(funktionen slutar fungera) eller, på Workers Paid, driva upp en kostnad.

Skyddet hör hemma i Cloudflare, inte i applikationskoden — en Worker har
ingen tillförlitlig delad räknare mellan isolat, så en rate limit i koden ger
falsk trygghet. Innan `SUPPORT_AI_LAGE=pa` sätts i produktion ska därför en
**Rate Limiting-regel** läggas upp i Cloudflare-dashboarden mot
serverfunktionens sökväg, förslagsvis i storleksordningen 10 anrop per minut
per IP.

Kodens egna begränsningar täcker resten: indata kapas till 600 tecken,
`max_tokens` är 200, timeouten är 4 sekunder, och funktionen är avstängd som
standard.

## Promptinjektion

Kundens text är fritext från internet och behandlas som data, inte som
instruktioner. Två lager skyddar:

1. Texten skickas avgränsad och systemprompten säger uttryckligen att
   innehållet är information om ett problem, aldrig instruktioner.
2. **Det avgörande lagret:** modellens svar valideras mot kunskapsbasen.
   `tolkaAiSvar` accepterar bara ett `flowId` som faktiskt finns bland
   `supportFlows`. En modell som luras att svara `{"flowId":"admin"}` ger
   därför null, och regelmotorn används i stället.

Modellens `tolkning` visas för kunden som text i React och renderas aldrig
som HTML eller som en instruktion. Den skickas inte vidare till
adminportalen — bara kundens egna ord och de val kunden själv gjort ingår i
ärendeloggen.

## API-token

`CLOUDFLARE_AI_TOKEN` ska vara en **scopad** token med enbart behörigheten
`Workers AI: Read`. Använd aldrig en global API-nyckel. Token är server-only,
prefixas aldrig med `VITE_`, och loggas aldrig — felloggarna innehåller bara
statuskod respektive feltyp, aldrig kundens text eller token.

## Checklista före aktivering

- [ ] Rate Limiting-regel uppsatt i Cloudflare mot serverfunktionens sökväg.
- [ ] Scopad token skapad med enbart `Workers AI: Read`.
- [ ] `CLOUDFLARE_ACCOUNT_ID` och `CLOUDFLARE_AI_TOKEN` satta som Worker-secrets.
- [ ] Integritetspolicyn uppdaterad med AI-behandlingen (klar, se
      `legal-dialog.tsx`).
- [ ] Registret över behandlingar uppdaterat (klar, se
      `register-over-behandlingar.md`).
- [ ] `SUPPORT_AI_LAGE=pa` sätts sist, efter övriga punkter.

## Modellbyte

`SUPPORT_AI_MODELL` byter modell utan kodändring. Vid byte: kontrollera att
den nya modellen fortfarande svarar med giltig JSON i det format
`tolkaAiSvar` förväntar sig, och att Neuronkostnaden ryms i dygnskvoten.
