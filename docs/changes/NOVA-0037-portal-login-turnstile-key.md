---
id: NOVA-0037
date: 2026-08-11
date_precision: day
type: fixed
status: completed
systems:
  - nova-it-web
  - kundportal
---

# Portal-login använder kundportalens Turnstile site key

## Vad ändrades?

- Portal-dropdownen på `nova-it.se` hämtar nu Turnstile site key från kundportalens publika runtime-konfiguration.
- Kontaktformuläret på `nova-it.se` fortsätter använda huvudsidans egen Turnstile-konfiguration.

## Varför?

Header-inloggningen skapar Turnstile-token på `nova-it.se`, men token verifieras av `kundportal.nova-it.se` när formuläret postas dit. Då måste token skapas med samma Turnstile site/secret-par som kundportalen verifierar mot.

## Resultat

Portal-dropdownen ska inte längre landa i kundportalens generiska `Fel ärendenummer eller lösenord` på grund av ett Turnstile key/secret-mismatch när samma uppgifter fungerar direkt på kundportalen.

## Dokumentationspåverkan

Ingen.
