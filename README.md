# Nova IT

Copyright (c) 2026 Nova IT. All rights reserved. See [LICENSE](LICENSE).

Nova IT är en svensk IT-supportwebb för datorproblem, nätverk, installationer, säkerhet, backup och tydliga kontaktflöden. Projektet är i förlanseringsläge inför kommande migrering till webbhotell.

Lägg inte in påhittade kundsiffror, organisationsnummer, adresser, telefonnummer, omdömen eller servicenivåer. Riktiga hemligheter och API-nycklar får aldrig ligga i frontend-kod.

## Teknik

- React 19
- TypeScript
- TanStack Start och TanStack Router
- Tailwind CSS 4
- Radix UI-komponenter
- Zod-validering

## Aktuella sidor

- `/`
- `/tjanster`
- `/kontakt`
- `/arbetssatt`
- `/faq`
- `/om-oss`

## Köra projektet

Projektet använder Bun-låsfil, men scripts kan även köras med npm om beroendena är installerade.

```bash
bun install
bun run dev
```

Kontroller:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

All verifiering:

```bash
bun run ci
```

## Arbetsflöde

`main` ska alltid vara den senaste stabila versionen. Större förändringar görs på en separat branch och granskas i en pull request innan de går in i `main`.

Den visuella redesignen och robotassistentens React-integration är genomförda. Den flytande roboten använder en regelbaserad motor med 13 ärendespår och leder besökaren vidare till kontakt. Nästa större steg är att koppla kontaktflödet till vald lösning hos webbhotell eller ärendehantering.

## Dokumentation

- [Promptindex](docs/prompt-index.md)
- [Rapport för visuell redesign](docs/visual-redesign-report.md)
- [Supportbotens integrationsplan](docs/supportbot-integration-plan.md)
- [Rapport för supportbotintegrationen](docs/supportbot-integration-report.md)
- [Arbetsflöde](docs/workflow.md)
- [Roadmap](docs/roadmap.md)
- [Deploy och publicering](docs/deployment.md)
