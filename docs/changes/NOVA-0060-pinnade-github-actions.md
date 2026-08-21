---
id: NOVA-0060
date: 2026-08-21
date_precision: day
type: infrastructure
status: completed
systems:
  - github-actions
---

# Pinnade GitHub Actions

## Vad ändrades?

GitHub Actions-workflows har uppdaterats så externa actions refereras med fasta commit-SHA:n i stället för flytande versionsetiketter.

## Varför?

Fasta referenser minskar risken att en tredjeparts-action ändras oväntat mellan körningar och gör CI-kedjan mer reproducerbar.

## Resultat

CI- och dokumentationsflödena behåller samma funktion men får tydligare försörjningskedjekontroll.

## Dokumentationspåverkan

Ingen.
