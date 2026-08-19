---
id: NOVA-0051
date: 2026-08-19
date_precision: day
type: fixed
status: completed
systems:
  - kundportal
---

# Rätta interna driftdokument som motsade GDPR-dokumentationen v1.5.2

## Vad ändrades?

Två interna, "aktuellt läge"-dokument innehöll språk som v1.5.2-granskningen
av GDPR-/AI-dokumentationen (Nova-IT-Portaler) redan hade ersatt, men som
aldrig fördes över hit:

- `docs/register-over-behandlingar.md`, registerposten "Kundportalens
  konto och inloggning": grunden angav fortfarande "Berättigat
  intresse/avtal", trots att v1.5.2 uttryckligen flyttade kontots grund
  till enbart artikel 6.1 f (kontot skapas automatiskt utan kundens
  separata val och är inte ett avtalskrav). Lagringstexten sa "så länge
  kundrelationen är aktiv" i stället för den nya konkreta
  24-månadersgränsen.
- `docs/sakerhetsdrift-runbook.md`, tabellen "Gallring och minimering":
  samma vaga "vid avslutad kundrelation"-formulering för kontot, samt en
  helt inaktuell rad om "Tillfälliga lösenord" - de finns inte längre i
  flödet sedan NOVA-0049 (aktiveringslänk ersatte tillfälligt lösenord).

Båda uppdaterade till att spegla den automatiserade 24-månadersgallringen
(`kundportal/lib/admin/kundkonto-gallring.ts`, Nova-IT-Portaler) och
kontots faktiska rättsliga grund.

`docs/kundportal-planering.md` och `docs/kundportal-arbetsorder.md`
rördes INTE - de är historiska planeringsdokument som redan har en
tydlig "SUPERSEDED"-uppdateringsnot från NOVA-0049 och ska bevaras som
historik, inte skrivas om.

## Varför?

Just den här sortens glapp mellan vad koden faktiskt gör och vad
dokumentationen säger var precis vad som startade hela
GDPR-granskningen från början (det ursprungliga fyndet om
klartextlösenordet). Efter att v1.5.2 skärpte den externa/juridiska
dokumentationen fanns det ingen automatisk mekanism som förde över
samma rättelser till de interna driftdokumenten - en manuell
genomgång gjordes därför som en direkt uppföljning.

## Resultat

De interna driftdokumenten säger nu samma sak som den juridiskt
granskade dokumentationen om kundportalskontots grund och
retentionsgräns. Ingen ytterligare avvikelse hittades vid en
sökning genom `docs/*.md` efter samma mönster ("6.1 b" kopplat till
kundportalen, "kundrelationen är aktiv", "tillfälligt lösenord").

## Dokumentationspåverkan

Ingen ytterligare - detta ÄR dokumentationsfixet.
