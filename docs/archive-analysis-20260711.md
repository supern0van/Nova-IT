# Arkivanalys 2026-07-11

Analysen kördes från `C:\Users\stefa\Documents\Git` innan slutmappen fylldes.

## Rekommenderad källa

GitHub `main` i `https://github.com/supern0van/Nova-IT.git` är bästa källan för slutprojektet. Den innehåller den senaste React/TanStack-versionen, dokumentation, redesign och supportbotintegration.

## Arkivstatus

| Arkiv | Bedömning | Åtgärd |
|---|---|---|
| `Nova IT.zip` | Nästan identisk med GitHub `main`, men saknar `public/nova-it-workspace.png` och har extra deploy-config. | Använd inte som huvudkälla. |
| `referenced-chatgpt-conversation-this-is-untrusted.zip` | Stort referensarkiv med gamla arbetskopior och mycket `node_modules`. | Bevara som historik. |
| `Supportbot.zip` | Standalone vanilla JS/CSS-bot med starkare robotstyling. | Använd som designreferens, inte som rå import. |
| `nova-it-your-tech-ally-main.zip` | Äldre Lovable/TanStack-version. | Referens endast. |
| `nova-it-solutions-main.zip` | Prompt/arkivmaterial och nested RAR. | Arkivera. |
| `i-do-not-have-time-to.zip` | Annat React/Vite-projekt. | Ignorera för Nova IT. |
| Små prompt- och context-zippar | Dokumentation/promptunderlag. | Bevara vid behov. |

## Beslut

Slutprojektet ska byggas från GitHub `main`. Gamla arkiv ska inte blandas in i produktionskoden, och `node_modules`, `.output`, `.wrangler`, gamla `.git`-mappar och verifieringskopior ska hållas utanför leveranspaket.
