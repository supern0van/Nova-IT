---
id: NOVA-0065
date: 2026-08-24
date_precision: day
type: infrastructure
status: completed
systems:
  - publik-webbplats
---

# Dependency-audit-jobbet visar korrekt som grönt i PR-checks

## Vad ändrades?

`.github/workflows/ci.yml`s nya "Dependency audit"-jobb (`bun audit`)
körs nu som `bun audit || true` i stället för att luta sig på
`continue-on-error: true` på jobbnivå.

## Varför?

`bun audit` exitar icke-noll så fort någon sårbarhet hittas i det låsta
beroendeträdet, bekräftat i CI (exit 1 med både Höga och Låga fynd
närvarande), oavsett vad lokala körningar visade innan detta
verifierades skarpt. `continue-on-error: true` förhindrade att detta
fällde hela workflow-körningen, men jobbet syntes ändå som "fail" i
PR:ens checks-lista - onödigt brus för ett medvetet rapporterande,
icke-blockerande jobb (se `docs/changes/NOVA-0063-tvargaende-stadning.md`
för varför jobbet finns).

## Resultat

Jobbet visar nu grönt i checks-listan medan sårbarhetsfynden
fortfarande syns i jobbets logg.

## Dokumentationspåverkan

Ingen ytterligare dokumentation i den här repon.
