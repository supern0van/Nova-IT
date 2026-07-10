# Nova IT

Nova IT är ett fiktivt svenskt demo-case för IT-support, nätverk, säkerhet och tydliga kontaktflöden. Projektet började som en Lovable-export och har därefter förbättrats i Codex.

Projektet ska förbli demo-säkert tills ett uttryckligt beslut tas om en verklig lansering. Lägg inte in påhittade kundsiffror, organisationsnummer, adresser, telefonnummer, omdömen eller servicenivåer. Riktiga hemligheter och API-nycklar får aldrig ligga i frontend-kod.

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
- `/assistent`
- `/kontakt`
- `/case-study`
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
bun run build
```

## Arbetsflöde

`main` ska alltid vara den senaste stabila versionen. Större förändringar görs på en separat branch och granskas i en pull request innan de går in i `main`.

Den visuella redesignen och supportbotens React-integration är genomförda. `/assistent` och den globala Nova-guiden använder samma regelbaserade motor med 13 ärendespår. Backend, ticketing och riktig AI är uttryckligen inte del av den här frontend-etappen.

## Dokumentation

- [Promptindex](docs/prompt-index.md)
- [Rapport för visuell redesign](docs/visual-redesign-report.md)
- [Supportbotens integrationsplan](docs/supportbot-integration-plan.md)
- [Rapport för supportbotintegrationen](docs/supportbot-integration-report.md)
