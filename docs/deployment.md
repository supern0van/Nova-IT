# Deploy och publicering

Projektet är redo att byggas, men ska inte publiceras som skarp webbplats förrän innehåll, kontaktuppgifter och ägarbeslut är klara.

## Lokal build

```bash
bun install --frozen-lockfile
bun run ci
```

Build-output skapas i `.output` och ska inte commitas.

## Miljövariabler

Utgå från `.env.example`.

Regel: frontendvariabler kan läsas av besökaren. Lägg därför aldrig API-nycklar, GitHub-tokens, ärendesystemsnycklar eller privata kunduppgifter i Vite-variabler.

## GitHub Actions

CI körs på push och pull request mot `main`.

Verifieringen kör:

- `bun install --frozen-lockfile`
- `bun run test`
- `bun run lint`
- `bun run typecheck`
- `bun run build`

## Publiceringsbeslut

Innan live-deploy behövs beslut om:

- domän
- riktig kontaktinformation
- om webbplatsen fortfarande ska vara demo-säker
- hostingplattform
- eventuell backend för kontaktformulär och supportbot
