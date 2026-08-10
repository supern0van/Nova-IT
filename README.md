# Nova IT

En svensk webbplats för praktisk IT-support, nätverk, installationer, säkerhet och tydliga supportärenden.

**Live:** [nova-it.se](https://nova-it.se)  
**Källkod:** [supern0van/Nova-IT](https://github.com/supern0van/Nova-IT)

`nova-it.se` är den publika adressen. `www.nova-it.se`, `novait.se` och `www.novait.se` skickas permanent vidare till den.

## Start här

| Jag vill... | Läs / kör |
| --- | --- |
| Få en snabb bild av läget | [Projektstatus](docs/project-status.md) |
| Förstå resan från idé till nuvarande lösning | [Projekthistorik](docs/project-history.md) |
| Se större förändringar och deras sammanhang | [Changelog](docs/CHANGELOG.md) |
| Förstå varför viktiga vägval gjordes | [Beslutslogg](docs/DECISIONS.md) |
| Förstå hela dokumentationsstrukturen | [Dokumentationsnav](docs/README.md) |
| Starta sidan lokalt | `bun install --frozen-lockfile` och `bun run dev` |
| Verifiera en ändring | `bun run ci` |
| Publicera en verifierad build från `main` | [Deploy och drift](docs/deployment.md) |

## Projektkarta

```text
src/             Applikationskod: routes, komponenter och funktioner
public/          Bilder, verifieringsfiler och andra publika tillgångar
docs/            Historik, beslut, drift, kvalitet och arbetsdokumentation
docs/changes/    Korta changelog-fragment för framtida större uppdateringar
.github/         CI, dokumentationskontroll och PR-mall
```

Huvudfunktioner:

- React, TypeScript, TanStack Start och Tailwind CSS
- Cloudflare Workers för publik drift
- Kontaktflöde med förvald tjänst och e-postutkast
- Regelbaserad supportassistent som växlar till kontaktflödet vid behov

## Utveckling

```bash
bun install --frozen-lockfile
bun run dev
```

All verifiering:

```bash
bun run ci
```

## Dokumentation

- [Dokumentationsnav](docs/README.md)
- [Projektstatus](docs/project-status.md)
- [Projekthistorik](docs/project-history.md)
- [Changelog](docs/CHANGELOG.md)
- [Beslutslogg](docs/DECISIONS.md)
- [Dokumentationsflöde](docs/documentation-workflow.md)
- [Deploy och drift](docs/deployment.md)
- [Arbetsflöde](docs/workflow.md)
- [E-post och DNS-handoff](docs/email-dns-handoff.md)
- [Portalens startläge](docs/portal-readiness.md)

Portalkoden ligger numera i det privata repot `supern0van/Nova-IT-Portaler`.
- [Roadmap](docs/roadmap.md)
- [Lovable-integrationen](docs/integrations/lovable.md)
- [Design-QA](docs/quality/design-qa-premium-service-system.md)
- [Visuell redesign](docs/visual-redesign-report.md)
- [Supportassistenten](docs/supportbot-integration-report.md)

## Dokumentationsregel för större ändringar

Betydande förändringar ska få ett kort fragment i `docs/changes/`. GitHub Actions kontrollerar detta i pull requests. Fragmentet beskriver inte bara vad som ändrades utan även varför och vilket resultat förändringen gav.

## Projektregler

Inga riktiga hemligheter, API-nycklar eller kunduppgifter får läggas i frontend-kod eller Git. Hitta inte på kundsiffror, adresser, omdömen eller servicenivåer.

Lovable är kvar som ursprunglig editor- och Git-integration, men Cloudflare Workers är driftmiljön för den publika webbplatsen. Se [integrationsgränsen](docs/integrations/lovable.md).

Copyright (c) 2026 Nova IT. All rights reserved. See [LICENSE](LICENSE).
