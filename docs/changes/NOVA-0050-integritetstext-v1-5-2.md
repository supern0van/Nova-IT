---
id: NOVA-0050
date: 2026-08-19
date_precision: day
type: changed
status: completed
systems:
  - publik-webbplats
---

# Uppdatera integritetstexten enligt GDPR-dokumentationen v1.5.2

## Vad ändrades?

`src/components/legal-dialog.tsx`s integritetstext uppdaterades för att
spegla den juridiska granskning och de justeringar som skrevs in i Nova
IT:s separata GDPR-/AI-dokumentationspaket, version 1.5.2
(`Nova-IT-Portaler`, `documents/public/01_Integritetspolicy_v1_5_2.docx`):

- Kundportalskontots rättsliga grund beskrivs nu uttryckligen som
  berättigat intresse (artikel 6.1 f) i stället för att lämnas outtalad -
  kontot skapas automatiskt utan ett separat val från kunden och är inte
  strikt nödvändigt för att hjälpa med ärendet i sig.
- Ett nytt, konkret retentionsvillkor för kundportalskontot: det tas bort
  senast 24 månader efter kundens senaste inloggning eller
  ärendeaktivitet, med möjlighet att be om tidigare radering.
- Rättighetsavsnittet förtydligat: invändningsrätten gäller nu
  uttryckligen även kundportalskontot, eftersom det grundas på berättigat
  intresse.
- Versionsetikett och "senast uppdaterad"-datum uppdaterade.

## Varför?

Den juridiska granskningen av dokumentationspaketet identifierade att
kundportalskontots rättsliga grund tidigare var otydlig/för svag
(behandlades implicit som ett avtalskrav trots att kontot skapas
automatiskt utan kundens separata val) och att retentionstexten för
kontot var för vag ("så länge kundrelationen är aktiv", utan konkret
utlösande händelse). Den publika texten ska inte säga något annat än vad
den interna, juridiskt granskade dokumentationen faktiskt fastställer.

## Resultat

Den publika integritetstexten stämmer nu överens med v1.5.2-paketets
rättsliga grund och retentionsgräns för kundportalskontot. Den tekniska
gallringsautomatiken som verkställer 24-månadersgränsen byggdes i samma
arbetsomgång i `Nova-IT-Portaler`
(`kundportal/lib/admin/kundkonto-gallring.ts`, en daglig Cloudflare Cron
Trigger).

## Dokumentationspåverkan

Ingen ytterligare dokumentation i den här repon. Källdokumentet ligger i
`Nova-IT-Portaler`, `documents/public/01_Integritetspolicy_v1_5_2.docx`.
