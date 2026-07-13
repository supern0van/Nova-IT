# Projektstatus

Senast uppdaterad: 2026-07-13

## Publik drift

| Del | Status |
| --- | --- |
| Publik adress | [https://nova-it.se](https://nova-it.se) |
| Canonical domain | `nova-it.se` |
| Alias | `www.nova-it.se`, `novait.se` och `www.novait.se` omdirigerar permanent till canonical domain |
| Driftmiljö | Cloudflare Workers |
| Worker | `supern0van-nova-it` |
| HTTPS | Cloudflare Universal SSL och Always Use HTTPS |

## Källa och brancher

- GitHub är projektets källa.
- `main` är den stabila releasegrenen.
- Aktivt hemsidearbete ligger på `codex/premium-service-system` tills det är redo att gå in i `main`.
- Lovable är anslutet till Git, men är inte den publika hostingen.

## Kvalitetsläge

- `bun run test`: 7 tester passerar.
- `bun run typecheck`: passerar.
- `bun run build`: passerar och genererar Cloudflare Worker-output.
- `bun run lint`: inga fel; sex tidigare Fast Refresh-varningar finns i delade UI-primitiver och blockerar inte build eller deploy.

## Nuvarande funktioner

- Sidor för hem, tjänster, arbetssätt, FAQ, om Nova IT och kontakt.
- Tjänsteval förs vidare till kontaktformulär med rätt förval.
- Supportassistenten använder en lokal, regelbaserad kunskapsmotor med trygg eskalering till kontaktformulär.
- Kontaktflödet sammanställer ärendet och öppnar ett e-postutkast till `kontakt@nova-it.se`; det skickar inte data till ett externt ärendesystem eller en backend.
- Publika kontaktadresser är `kontakt@nova-it.se`, `support@nova-it.se` och `info@nova-it.se`.

## Nästa fokuserade steg

1. Gå igenom kundtext, tjänsteerbjudande och prioriteter för varje sida.
2. Lägg in Loopias exakta MX-, SPF-, DKIM- och DMARC-poster i Cloudflare innan skarp e-post börjar användas.
3. Genomför tillgänglighets- och mobilrunda före presentation eller bredare lansering.
4. Avgör om kontaktformulär och assistent ska kopplas till ett ärendesystem eller en backend.
