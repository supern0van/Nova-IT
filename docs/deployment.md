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

### Förhandsgranskning

Förhandsvisningar görs från arbetsbranch och får aldrig ersätta produktion. Kommandot nedan skapar en tillfällig Cloudflare-preview utan att ändra trafiken till `nova-it.se`:

```bash
bun run deploy:preview
```

Cloudflare visar då en anspråkslänk. Öppna den inom den angivna tiden och koppla förhandsdriften till rätt Cloudflare-konto.

### Produktion

Produktion publiceras endast när ändringen finns i `main`, CI är grön och den har granskats i mobil och desktop. Efter `wrangler login` eller med `CLOUDFLARE_API_TOKEN`:

```bash
bun run deploy:production
```

Den genererade konfigurationen i `.wrangler/deploy/config.json` pekar på `.output/server/wrangler.json`. Ändra inte den genererade filen manuellt.

## Miljövariabler

Utgå från `.env.example`.

Regel: frontendvariabler kan läsas av besökaren. Lägg därför aldrig API-nycklar, GitHub-tokens, ärendesystemsnycklar eller privata kunduppgifter i Vite-variabler. Kontaktadresserna ligger medvetet som publika uppgifter i `src/lib/nova-data.ts`.

Kontaktformuläret skickar e-post server-side genom Resend. Det öppnar inte besökarens e-postapp och sparar inte ärenden i en databas. Se [kontaktformularets aktivering](contact-form-activation.md) för hela flödet och kontrollpunkterna.

När en verifierad avsändare är klar i Resend läggs hemligheterna in i Cloudflare efter bygget:

```powershell
bun run build
bunx wrangler secret put RESEND_API_KEY --config .output/server/wrangler.json
bunx wrangler secret put CONTACT_FORM_FROM --config .output/server/wrangler.json
bunx wrangler secret put CONTACT_FORM_TO --config .output/server/wrangler.json
```

Använd en Resend-nyckel med endast sändbehörighet. `CONTACT_FORM_FROM` kan exempelvis vara `Nova IT <no-reply@nova-it.se>` och `CONTACT_FORM_TO` ska vara `kontakt@nova-it.se`.

## GitHub Actions

CI körs på push och pull request mot `main`.

Verifieringen kör:

- `bun install --frozen-lockfile`
- `bun run test`
- `bun run lint`
- `bun run typecheck`
- `bun run build`

## Kvar för full kontakt- och e-postdrift

- alla fem Nova IT-adresser är skapade och testade hos Loopia
- verifiera `nova-it.se` och avsändaren `no-reply@nova-it.se` i Resend
- lägga in Cloudflare Worker-secrets för kontaktformuläret med `kontakt@nova-it.se` som mottagare och `no-reply@nova-it.se` som avsändare
- skicka ett verkligt testärende från webbplatsen och svara på det via `Reply-To`
- lägga till Turnstile och enkel begränsning av upprepade formulärskick före bred, öppen lansering
- genomföra den administrativa ändringen av Cloudflare-kontots inloggningsadress till `webmaster@nova-it.se` när den blir tillgänglig
