---
id: NOVA-0016
date: 2026-08-03
type: security
scope: github
---

## Vad ändrades?

Projektet fick en GitHub-säkerhetsbaslinje för beroenden och CI. Dependabot
bevakar nu root-projektets Bun-beroenden, adminportalens pnpm-beroenden och
GitHub Actions. CI-workflowen deklarerar dessutom explicit läsbehörighet för
repository-innehåll.

## Varför?

När Nova IT går från byggfas till skarp drift behöver beroendekedjan och
automationen få egna skyddsräcken. Det minskar risken att kända sårbarheter,
för breda workflow-rättigheter eller osynliga beroendeuppdateringar blir kvar
för länge.

## Resultat

GitHub kan skapa separata PR:er för beroende- och Actions-uppdateringar, och
CI kör med en tydligt avgränsad standardbehörighet.
