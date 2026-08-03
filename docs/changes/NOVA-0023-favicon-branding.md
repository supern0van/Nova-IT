---
id: NOVA-0023
date: 2026-08-03
date_precision: day
type: fixed
status: completed
systems:
  - public-site
  - admin-portal
  - branding
---

# Nova IT-favicon på alla webbdelar

## Vad ändrades?

Generiska Lovable-/v0-ikoner togs bort från adminportalen. Publika sidan och adminportalen använder nu Nova IT-loggan som favicon, och kundportalen har fått samma ikon via Next-layoutens app metadata.

## Varför?

Webbläsarflikar ska visa företagets korrekta logga på alla sidor och inte en kvarlämnad utvecklings- eller mallikon.

## Resultat

Alla routes i publika sidan, adminportalen och kundportalen har en gemensam Nova IT-favicon. Fallbacken till den tidigare generiska faviconen är borttagen.

## Dokumentationspåverkan

Ingen.
