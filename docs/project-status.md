# Projektstatus

Senast uppdaterad: 2026-08-23

## Kontaktuppgifter och bolagsinformation (internt referensdokument)

Fastställt av Stefan 2026-08-23. Detta är den auktoritativa källan för
Nova IT:s verkliga kontakt- och bolagsuppgifter - övriga dokument och
publik text ska stämma överens med detta.

| Uppgift | Värde | Visas publikt på nova-it.se? |
| --- | --- | --- |
| E-post | `kontakt@nova-it.se` | Ja |
| Telefon | 076-225 20 39 | Nej, inte ännu - inte publicerad på live-sajten |
| Adress | Persikogatan 12, Lgh 1302, Hässelby | Nej - medvetet borttagen (se NOVA-0055), finns bara i interna/juridiska dokument |
| Geografiskt område | Hässelby (Stockholm) | Ja, som serviceområde/riktning - inte som besöksadress |
| Bolagsform | Enskild firma | Ja (visas som "Nova IT (enskild firma)") |
| Innehavare | Stefan Bergstrand | Internt/juridiskt underlag |
| Org.nr | 19870528-0652 | Ja, som "Org.nr" utan förklarande etikett (sammanfaller med innehavarens personnummer eftersom firman är en enskild firma) |

Telefonnumret är inte publicerat på live-sajten ännu - om/när det ska bli en
publik kontaktväg är det ett separat beslut (se NOVA-0055-resonemanget om
integritetsrisk för hemadressen; ett mobilnummer är ett mindre allvarligt
men likartat övervägande).

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
- Supportassistenten kombinerar en lokal, regelbaserad kunskapsmotor med ett Cloudflare Workers AI-lager ovanpå, med trygg eskalering till kontaktformulär. Avsiktligt avstängd på live-sajten sedan 2026-08-21 (NOVA-0061) - ett medvetet, avslutat beslut, inte ett öppet läge.
- Kontaktformuläret har en server-side leveransväg via Resend. När den är aktiverad går ärendet direkt till `kontakt@nova-it.se` och besökaren svarar via sin angivna e-postadress. Det finns ingen lokal ärendedatabas i webbplatsen.
- Kontaktadresserna `kontakt@nova-it.se`, `support@nova-it.se`, `info@nova-it.se`, `webmaster@nova-it.se` och `no-reply@nova-it.se` är aktiva hos Loopia. `kontakt@nova-it.se` är den publika kontaktadressen och formulärets mottagare, medan `no-reply@nova-it.se` är teknisk avsändare.
- Integritet, kakor och villkor visas i kompakta dialoger på webbplatsen. Innehållet ska granskas på nytt innan en kundportal, e-handel eller annan persondatatung tjänst introduceras.

## Nästa fokuserade steg

1. Bättre admin-dashboard med mer automation - däribland att koppla in Nova
   IT:s Loopia-mejlkonton som en funktion i adminportalen (se
   `docs/admin-mail-integration-planering.md`). Ingen koppling till separat
   ärendesystem. Robotassistenten är inte en del av detta spår just nu - den
   är avsiktligt avstängd och det är avslutat, inte öppet.
2. Prisunderlag för tjänsterna: marknadsresearch klar (se
   `docs/priser-arbetsdokument.md`), Stefan sätter faktiska priser.
   Publiceras på sajten först när bolaget går live.
3. Fler tjänstekandidater att välja bland finns i
   `docs/tjanster-kandidater-arbetsdokument.md` (internt, ej publikt).
4. Fortsätt förfina kundtext, tjänsteerbjudande och prioriteringar för varje sida.

Se `docs/roadmap.md` för fullständig lista och avklarade punkter (Grind 6,
e-post-DNS, kundportalens M0-M6 är alla klara).
