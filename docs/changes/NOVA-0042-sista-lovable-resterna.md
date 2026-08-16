---
id: NOVA-0042
date: 2026-08-16
date_precision: day
type: removed
status: completed
systems:
  - publik-webbplats
---

# Sista Lovable-resterna ur koden

## Vad ändrades?

`src/integrations/lovable/error-reporting.ts` är borttagen tillsammans med sitt
anrop i rotens felgräns. Den rapporterade React-fel till en
`window.__lovableEvents`-hook som bara Lovable-editorn någonsin injicerade, och
var alltså en permanent no-op i produktion. `console.error` i samma komponent
skötte redan loggningen, så felhanteringen är oförändrad.

`bunfig.toml` listade fyra `@lovable.dev/*`-paket under
`minimumReleaseAgeExcludes`. Den listan bypassar det 24-timmars
leverantörskedjeskydd som repot i övrigt använder. Paketen finns inte längre i
projektet, så undantagen är borttagna och listan är nu tom.

`docs/integrations/lovable.md` beskrev en verklighet som inte längre gäller —
den påstod att wrappern levererade byggkonfigurationen och att shimmen fanns
kvar. Den är omskriven till vad som faktiskt återstår.

## Varför?

Undantag i ett leverantörskedjeskydd ska aldrig ligga kvar längre än paketen de
gäller. En tom lista är dessutom lättare att granska än en lista med namn som
ingen längre känner igen.

Shimmen var död kod som gav intryck av att felrapportering fanns.

## Resultat

Ingen kod i `src/` refererar till Lovable, och inget Lovable-paket är
installerat. Kvar som referens är `.lovable/project.json`, som inget läser, och
`AGENTS.md`.

Typecheck, lint och 82 tester är gröna.

## Dokumentationspåverkan

`docs/integrations/lovable.md` är omskriven och listar nu vad som togs bort och
när. Den noterar också att Google kan visa en cachad Lovable-ikon i
sökresultat trots att serverad favicon varit Nova IT-märket sedan NOVA-0023 —
det finns inget kvar att åtgärda i repot, men webbplatsen serverar ingen
`/favicon.ico`, vilket är den enda kvarvarande spaken om ikonen dröjer sig
kvar.
