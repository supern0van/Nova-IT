---
id: NOVA-0018
date: 2026-08-03
type: security
scope: dependencies
---

## Vad ändrades?

Adminportalens pnpm-konfiguration fick `brace-expansion`-overrides för de
sårbara 1.x-, 2.x- och 5.x-spåren, plus en `body-parser`-override för OpenNexts
Express-bundlade lågseverity-fynd. `portal/pnpm-lock.yaml` uppdaterades till
patchade versioner.

## Varför?

GitHub Dependabot flaggade först en high-severity sårbarhet i
`brace-expansion` via adminportalens lockfil. Den avslutande interna auditen
visade därefter att `pnpm audit` även hittade äldre sårbara major-versioner via
dev/build-kedjan, samt ett lågseverity-fynd i `body-parser`. Portalens separata
pnpm-app behövde därför styra samtliga sårbara spår till patchade versioner.

## Resultat

De sårbara `brace-expansion`- och `body-parser`-resolutionerna är borttagna ur
adminportalens lockfil och framtida installationer styrs till patchade versioner.
