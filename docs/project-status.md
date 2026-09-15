# Projektstatus

Senast uppdaterad: 2026-09-12

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
- `main` ska motsvara den stabila produktionsversionen.
- Arbetsbrancher granskas i lokal drift eller Cloudflare-preview innan de förs in i `main`.
- Lovable är anslutet till Git, men är inte den publika hostingen.

## Kvalitetsläge

- `bun run test`: passerar.
- `bun run typecheck`: passerar.
- `bun run build`: passerar och genererar Cloudflare Worker-output.
- `bun run lint`: körs som del av `bun run ci` före release.

## Nuvarande funktioner

- Sidor för hem, tjänster, arbetssätt, FAQ, om Nova IT och kontakt.
- Tjänsteval förs vidare till kontaktformulär med rätt förval.
- Supportassistenten använder en lokal, regelbaserad kunskapsmotor med trygg eskalering till kontaktformulär.
- Kontaktformuläret skapar ett riktigt kundkopplat ärende i Adminportalen via ett signerat server-till-server-intag. Resend skickar därefter intern avisering och kundbekräftelse; ett e-postfel tar inte bort det registrerade ärendet.
- Kontaktadresserna `kontakt@nova-it.se`, `support@nova-it.se`, `info@nova-it.se`, `webmaster@nova-it.se` och `no-reply@nova-it.se` är aktiva hos Loopia. `kontakt@nova-it.se` är den publika kontaktadressen och formulärets mottagare, medan `no-reply@nova-it.se` är teknisk avsändare.
- Integritet, kakor och villkor visas i kompakta dialoger på webbplatsen. Innehållet ska granskas på nytt innan en kundportal, e-handel eller annan persondatatung tjänst introduceras.

## Nästa fokuserade steg

1. Följ upp leveransstatus och dubblettskydd för det publika ärendeintaget.
2. Genomför regelbundna tillgänglighets- och mobilkontroller i releaseflödet.
3. Fortsätt förfina kundtext, tjänsteerbjudande och prioriteringar för varje sida.
4. Håll den publika webbens och portalernas deploymentstatus tydligt åtskilda.
