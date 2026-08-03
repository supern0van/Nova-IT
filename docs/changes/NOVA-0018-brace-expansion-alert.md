---
id: NOVA-0018
date: 2026-08-03
type: security
scope: dependencies
---

## Vad ändrades?

Adminportalens pnpm-konfiguration fick samma `brace-expansion`-override som
root-projektet, och `portal/pnpm-lock.yaml` uppdaterades till den patchade
5.0.9-versionen för minimatch 10.

## Varför?

GitHub Dependabot flaggade en high-severity sårbarhet i `brace-expansion` via
adminportalens lockfil. Root-projektet var redan låst till en patchad version,
men portalens separata pnpm-app behövde samma styrning.

## Resultat

Den sårbara 5.x-resolutionen är borttagen ur adminportalens lockfil och
framtida installationer styrs till patchad version.
