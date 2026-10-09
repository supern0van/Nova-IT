---
id: NOVA-0082
date: 2026-10-09
date_precision: day
type: security
status: completed
systems:
  - public-site
---

# Ta bort org.nr och annan personlig PII ur publika repot

## Vad ändrades?

- `src/components/legal-dialog.tsx` (integritetspolicyn, live på sajten):
  org.nr-raden ("Org.nr: 19870528-0652") borttagen ur den publika texten.
  Ersatt med en förklarande rad: org.nr lämnas i avtal/offert/faktura, inte
  i löpande text på webbplatsen.
- `docs/juridisk-granskning-underlag.md` och
  `docs/allmanna-villkor-it-tjanster.md`: org.nr och hemadress
  ("Persikogatan 12, 165 63 Hässelby") borttagna ur klartext, ersatta med
  en kort förklaring.
- `docs/kundportal-arbetsorder.md`: ägarens personliga e-postadress
  borttagen ur klartext.
- `docs/changes/NOVA-0055-...md`: den tidigare borttagna hemadressen
  togs bort ur själva changelog-texten också (den stod där citerad i
  klartext, trots att ändringen den beskrev var att ta bort den från
  sajten).

## Varför?

Nova-IT-repot är **publikt** på GitHub. Org.nr för en enskild firma
*är* innehavarens personnummer - det stod i klartext både live på
sajten och i flera dokument i det publika repot. Troligen roten till
upprepade dagliga säljsamtal (växeltjänster m.m.) - en helt vanlig
konsekvens av att ett personnummerformat scrapas från en publik
webbplats eller ett publikt GitHub-repo och säljs vidare som lead-data.

## Resultat

- `bun run typecheck`, `bun run lint` (0 fel), `bun run test` (190 pass)
  och `bun run build` gröna.
- Verifierat att inget av org.nr, hemadressen eller den personliga
  e-postadressen förekommer i den byggda outputen eller någon kvarvarande
  fil i arbetsträdet.
- **Begränsning:** det här tar bort informationen ur den NUVARANDE koden,
  men repot är publikt och har full historik - äldre commits (innan
  NOVA-0055 och denna ändring) innehåller fortfarande org.nr/adressen och
  är åtkomliga via GitHub:s historik/blame för vem som vill leta. En
  fullständig sanering kräver antingen att repot görs privat eller att
  historiken skrivs om (BFG/filter-repo + force-push), vilket
  `AGENTS.md` uttryckligen varnar för på grund av Lovable-synkroniseringen.
  Ingen historik ändrad i den här PR:n.

## Dokumentationspåverkan

Ingen ytterligare.
