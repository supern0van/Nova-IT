---
id: NOVA-0033
date: 2026-08-09
date_precision: day
type: infrastructure
status: completed
systems:
  - admin-portal
---

# Manuellt triggad GitHub Actions-deploy för adminportalen

## Vad ändrades?

Ny workflow `.github/workflows/deploy-admin-portal.yml` (`workflow_dispatch`) som bygger och deployar `nova-it-admin` till Cloudflare Workers på en GitHub-runner, i stället för lokalt via WSL.

## Varför?

Samma princip som Kundportalens `deploy.yml` (`supern0van/Nova-IT-Kundportal`): OpenNext-bygget slår i Windows symlink-begränsningar lokalt, och att köra WSL nästlad i den här sessionens egen sandlåde-VM har orsakat krascher tidigare. Manuell trigger, inte automatisk vid merge - produktion ska bara flyttas när det är ett medvetet beslut, inte av varje push.

## Resultat

Workflowen finns och är verifierad (`worker:secrets:check` och `smoke:worker` kördes lokalt mot den riktiga, nu rollbackade, Workern och passerade), men har inte körts - produktionen rör vi inte förrän deploy av `main` (som nu inkluderar NOVA-0033-föregångaren PR #46) är ett separat, uttryckligt beslut.

## Dokumentationspåverkan

Ingen.
