---
id: NOVA-0059
date: 2026-08-20
date_precision: day
type: infrastructure
status: completed
systems:
  - ci-cd
---

# CI: återställ aggregerad Verify frontend-kontroll

## Vad ändrades?

`.github/workflows/ci.yml` har fått ett avslutande jobb med namnet `Verify frontend`. Jobbet körs efter de fyra parallella kontrollerna Test, Lint, Typecheck och Build och blir grönt endast när samtliga fyra har lyckats.

## Varför?

Efter parallelliseringen av CI i NOVA-0056 försvann det tidigare check-namnet `Verify frontend`, men branch protection på `main` krävde fortfarande just den statuskontrollen. Resultatet var att nya pull requests kunde få alla faktiska CI-jobb gröna men ändå förbli blockerade från merge.

## Resultat

De fyra tunga kontrollerna fortsätter att köras parallellt, samtidigt som den befintliga branch-protection-regeln åter får sin aggregerade `Verify frontend`-status. Misslyckas någon underkontroll blir även aggregatjobbet rött.

## Dokumentationspåverkan

Ingen.
