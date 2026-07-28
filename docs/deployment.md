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

När routes läggs till eller tas bort ska den genererade `src/routeTree.gen.ts` följa med i samma ändring. En grön typkontroll och produktionsbuild är kontrollen att route-trädet och sidfilerna är synkroniserade.

## Adminportal på separat Worker

Adminportalen ligger i `portal/` och publiceras som separat Cloudflare Worker:

| Del | Värde |
| --- | --- |
| Worker | `nova-it-admin` |
| Primära adminadresser | `admin.nova-it.se`, `admin.novait.se` |
| Tillfälligt reserverade portaladresser | `portal.novait.se`, `portal.nova-it.se` |
| Worker-config | `portal/wrangler.jsonc` |
| OpenNext-config | `portal/open-next.config.ts` |

`portal.*`-adresserna pekar just nu till samma admin-Worker för att domänerna ska vara registrerade och fungerande. Det är en tillfällig koppling, inte kundportalens framtida arkitektur. En kundportal ska få egen Worker och egna routes när det spåret påbörjas.

Adminportalen använder `portal/middleware.ts` som OpenNext-kompatibel ingång till serverskyddet. Byt inte till Next.js 16:s root-`proxy.ts` förrän OpenNext uttryckligen stöder den modellen för Cloudflare Workers.

### Lokal verifiering före admin-deploy

Kör från `portal/`:

```bash
pnpm test
pnpm lint
pnpm exec tsc --noEmit --pretty false
```

OpenNext Worker-bygget ska verifieras i Linux/WSL eftersom OpenNext kan slå i Windows symlink-begränsningar:

```bash
pnpm deploy:dry-run
```

Efter deploy ska live-Worker-smoken köras:

```bash
pnpm smoke:worker
```

Den verifierar att samtliga admin-/portal-domäner svarar med inloggningsredirect och att skyddade API:er (`/api/roll`, `/api/admin/systemstatus`, `/api/admin/profiler`) nekar oinloggad trafik fail-closed.

### Obligatoriska Worker-secrets

Följande secrets måste finnas på `nova-it-admin`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Kontrollera att samtliga obligatoriska secrets finns utan att skriva ut värden:

```bash
pnpm worker:secrets:check
```

Vid manuell felsökning kan namnen och senaste deployhistorik listas med:

```bash
pnpm worker:secrets
pnpm worker:deployments
```

### Adminportal i GitHub Actions

CI har ett separat jobb för `portal/`. Det kör portalens egna pnpm-baserade verifiering och bygger den faktiska OpenNext Worker-bundlen. Root-projektets Bun-baserade lint/build ska inte lint-köra `portal/`, eftersom adminportalen är en separat Next/pnpm-app med egen ESLint-konfiguration.

## Kvar för full kontakt- och e-postdrift

- alla fem Nova IT-adresser är skapade och testade hos Loopia
- verifiera `nova-it.se` och avsändaren `no-reply@nova-it.se` i Resend
- lägga in Cloudflare Worker-secrets för kontaktformuläret med `kontakt@nova-it.se` som mottagare och `no-reply@nova-it.se` som avsändare
- skicka ett verkligt testärende från webbplatsen och svara på det via `Reply-To`
- lägga till Turnstile och enkel begränsning av upprepade formulärskick före bred, öppen lansering
- genomföra den administrativa ändringen av Cloudflare-kontots inloggningsadress till `webmaster@nova-it.se` när den blir tillgänglig
