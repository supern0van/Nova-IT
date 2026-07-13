# Deploy och drift

Projektet drivs publikt på Cloudflare Workers.

| Del | Värde |
| --- | --- |
| Publik adress | `https://nova-it.se` |
| Worker | `supern0van-nova-it` |
| Alias | `www.nova-it.se`, `novait.se`, `www.novait.se` |
| HTTPS | Cloudflare Universal SSL och Always Use HTTPS |

Aliasadresserna omdirigeras till `https://nova-it.se` i `src/server.ts`. Den filen är därför källan för canonical-domain-beteendet.

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

## Kvar för full kontakt- och e-postdrift

- riktig kontaktadress, telefon och verksamhetsområde
- SPF, DKIM och DMARC för den e-posttjänst som väljs
- beslut om formuläret ska gå till e-post, ärendesystem eller egen backend
- eventuell backend eller AI-tjänst för supportassistenten
