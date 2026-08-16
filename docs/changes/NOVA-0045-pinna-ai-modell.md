---
id: NOVA-0045
date: 2026-08-16
date_precision: day
type: infrastructure
status: completed
systems:
  - publik-webbplats
---

# Pinna AI-sammanfattningens modell till llama-3.2-3b-instruct-v2

## Vad ändrades?

`STANDARDMODELL` i `support-ai-server.ts` pekar nu på
`@cf/meta/llama-3.2-3b-instruct-v2` i stället för
`@cf/meta/llama-3.2-3b-instruct`.

## Varför?

Cloudflare aliasar det äldre modellnamnet tyst till `-v2` - bekräftat genom
ett direkt anrop mot skarpt Workers AI, svaret angav
`"model": "@cf/meta/llama-3.2-3b-instruct-v2"`. Att peka rätt explicit är
säkrare än att lita på att aliaset finns kvar; om Cloudflare någon gång tar
bort det utan förvarning hade den gamla referensen slutat fungera helt i
stället för att bara sluta vara pinnad till en specifik version.

Svarsformatet påverkas inte av bytet - `extraheraModellsvar` hanterar redan
både `response` som sträng och `choices[].message.content`, vilket verkligen
förekommer i svaren från den här modellen.

## Resultat

Samma fixed model-referens som redan används i adminportalens
AI-sammanfattning (Nova-IT-Portaler, se
`docs/portal-lyft/2026-08-16-ai-sammanfattning-adminportal.md`), som gjorde
samma upptäckt och samma fix samtidigt.

## Dokumentationspåverkan

Ingen.
