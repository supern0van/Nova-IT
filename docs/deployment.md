# Deploy och publicering

Projektet byggs för Cloudflare Workers. En första extern förhandsdrift kan göras utan kontoanslutning; permanent publicering kräver ett Cloudflare-konto och en domän när sådan är klar.

## Lokal build

```bash
bun install --frozen-lockfile
bun run ci
```

Build-output skapas i `.output` och ska inte commitas.

## Cloudflare Workers

För extern förhandsvisning utan inloggning:

```bash
bun run deploy:preview
```

Cloudflare visar då en anspråkslänk. Öppna den inom den angivna tiden och koppla förhandsdriften till rätt Cloudflare-konto.

För permanent deploy efter `wrangler login` eller med `CLOUDFLARE_API_TOKEN`:

```bash
bun run deploy
```

Den genererade konfigurationen i `.wrangler/deploy/config.json` pekar på `.output/server/wrangler.json`. Ändra inte den genererade filen manuellt.

## Miljövariabler

Utgå från `.env.example`.

Regel: frontendvariabler kan läsas av besökaren. Lägg därför aldrig API-nycklar, GitHub-tokens, ärendesystemsnycklar eller privata kunduppgifter i Vite-variabler. `VITE_NOVA_CONTACT_EMAIL` får innehålla en publik kontaktadress och används för att skapa ett e-postutkast från kontaktformuläret.

## GitHub Actions

CI körs på push och pull request mot `main`.

Verifieringen kör:

- `bun install --frozen-lockfile`
- `bun run test`
- `bun run lint`
- `bun run typecheck`
- `bun run build`

## Kvar inför egen domän

Innan egen domän och fullt kontaktflöde kopplas behövs:

- domän
- riktig kontaktinformation
- om formuläret ska gå till e-post, ärendesystem eller annan backend
- hostingplattform
- eventuell backend för kontaktformulär och supportbot
