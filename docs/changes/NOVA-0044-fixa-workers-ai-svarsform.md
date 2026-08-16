---
id: NOVA-0044
date: 2026-08-16
date_precision: day
type: fixed
status: completed
systems:
  - publik-webbplats
---

# Fixa Workers AI-svarsform: response kan vara ett redan uppackat objekt

## Vad ändrades?

`support-ai.ts` fick en ny funktion, `extraheraModellsvar`, som läser Workers
AI:s resultatobjekt robust: den prövar `response` som sträng, därefter
`choices[0].message.content` (alltid en sträng i chat-completions-formatet),
och som sista utväg stränglägger ett redan uppackat `response`-objekt. Både
`klassificeraViaBindning` och `klassificeraViaRest` i `support-ai-server.ts`
använder nu denna i stället för att anta att `response` alltid är en sträng.

## Varför?

Efter att `SUPPORT_AI_LAGE=pa` slogs på i produktion för första gången
returnerade AI-stödet konsekvent `null` - inte fel, bara tyst overksamt.
Ett direktanrop mot Workers AI med exakt samma prompt som koden bygger visade
orsaken: modellen `@cf/meta/llama-3.2-3b-instruct` svarade helt korrekt, men
`result.response` var redan ett uppackat JSON-objekt
(`{"flowId":"slow-computer","urgency":"standard","tolkning":"..."}`), inte en
sträng. Koden testade `typeof ratext !== "string"` och kastade därför bort ett
fullt giltigt svar varje gång.

En misstänkt teckenkodningsbugg (`L�ngsam` i en tidig felsökningslogg)
undersöktes och avfärdades - det var en terminalvisningsartefakt i
felsökningsverktyget, inte skadade bytes. Riktiga svenska tecken (å/ä/ö)
kommer korrekt kodade (`å` etc.) i det faktiska API-svaret, verifierat
genom att skriva svaret till fil och läsa det tillbaka med explicit
UTF-8-avkodning i stället för att lita på terminalens egen rendering.

## Resultat

AI-klassificeringen fungerar nu i produktion. Verifierat mot skarp Workers AI:
för indata "min gamla dator kraschar hela tiden när jag har typ 10 flikar
öppna samtidigt" föreslog modellen `slow-computer` (flera öppna flikar) i
stället för regelmotorns `windows` (matchade bara på ordet "kraschar") - ett
konkret exempel på att AI-lagret tillför verklig förståelse utöver
nyckelordsmatchning, inte bara en påslagen flagga.

9 nya tester (4 i `support-ai.test.ts` för `extraheraModellsvar` isolerat, 2
regressionstester i `support-ai-server.test.ts` som återskapar exakt den
skarpa svarsformen för både bindnings- och REST-vägen). 93 tester totalt
gröna, typecheck och lint rena, produktionsbygge grönt.

## Dokumentationspåverkan

Ingen. Felet fanns bara i tolkningen av ett externt API-svar, inte i det
dokumenterade kontraktet.
