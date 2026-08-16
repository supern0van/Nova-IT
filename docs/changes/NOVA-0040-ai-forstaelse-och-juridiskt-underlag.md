---
id: NOVA-0040
date: 2026-08-16
date_precision: day
type: added
status: completed
systems:
  - publik-webbplats
---

# AI-stödd ärendeförståelse och komplett juridiskt underlag

## Vad ändrades?

**AI-stöd via Cloudflare Workers AI.** Supportguidens fritext kan skickas till
en språkmodell hos Cloudflare för att föreslå ärendekategori och en
sammanfattning. Funktionen är avstängd som standard och slås på med
`SUPPORT_AI_LAGE=pa`.

AI:n är ett tillägg, aldrig en ersättning. Regelmotorn svarar först och
lokalt; AI:n körs parallellt och får bara komma med ett förslag om den landar i
ett annat område. Kunden väljer själv — området byts aldrig automatiskt.
Modellens svar valideras mot kunskapsbasen, så ett påhittat kategori-id
förkastas och regelmotorn används i stället.

**Juridiskt underlag.** Tre dokument tillkom eller kompletterades:

- `allmanna-villkor-it-tjanster.md` — nytt, fullständigt villkorsutkast i 16
  punkter, med ansvar vid dataförlust, ångerrätt, reklamation på begagnad
  hårdvara, betalning, retentionsrätt och tvistlösning via ARN.
- `juridisk-granskning-underlag.md` — nytt, systemkarta och prioriterad lista
  över vad som återstår före bred lansering.
- `personuppgiftsbitradesavtal.md` — fick en punkt om tredjelandsöverföring och
  den bilaga A som artikel 28.3 kräver men som saknades.

Integritetspolicyn och kakinformationen på webbplatsen beskriver nu
supportguiden, den tillfälliga sessionslagringen och AI-behandlingen.
Registret över behandlingar fick tre nya poster.

`anvandarvillkor.md` ersattes; innehållet är inarbetat i de nya villkoren.
`portal-readiness.md` märktes som historiskt — det påstod att portalen var
"reserverad för framtida bruk" trots att den varit i drift sedan 2026-07-30.

`security.txt` pekade på `admin@nova-it.se`, en adress som inte finns bland de
aktiva. Den ersattes med `kontakt@nova-it.se`.

## Varför?

Regelmotorn matchar på nyckelord och missar formuleringar som inte liknar dem.
En språkmodell förstår fritext bättre. Cloudflare valdes för att de redan är
personuppgiftsbiträde för webbdriften — inget nytt biträde tillkommer, till
skillnad från OpenAI, Anthropic eller Google, som var för sig hade krävt nytt
avtal och ny tredjelandsbedömning.

Det juridiska underlaget saknade allt som rör själva IT-tjänsten. Ett företag
som hanterar kunders hårddiskar utan skriven ansvarsbegränsning vid
dataförlust bär en risk som inte syns förrän den inträffar.

En säkerhetsrapport skickad till en adress som inte finns når ingen.

## Resultat

Guiden kan förstå fritext betydligt bättre, utan att bli beroende av att
AI-tjänsten fungerar. Nova IT har ett villkorsutkast och ett granskningsunderlag
som en jurist kan arbeta vidare från i stället för att börja med att kartlägga
systemet. Webbplatsens integritetsinformation beskriver det som faktiskt sker.

## Dokumentationspåverkan

`docs/supportassistent-ai-drift.md` beskriver drift, kostnad, missbruksrisk och
en checklista som måste vara avbockad före aktivering — särskilt en Cloudflare
Rate Limiting-regel, eftersom endpointen är publik och oautentiserad.
