---
id: NOVA-0072
date: 2026-09-12
type: security
scope: public-web
---

## Vad ändrades?

Den publika Worker-konfigurationen fick ett stabilt namn, aktuell
kompatibilitetsdag och observability. Felrapporteringen gjordes
request-lokal, cookieinformationen anpassades till faktisk lagring,
integritetstexten och sitemap rättades och CI blockerar nu sårbarheter på
high-nivå. Dokumentationen beskriver åter det verkliga ärendeintaget.

## Varför?

Totalgranskningen hittade risk för korskopplade feluppgifter mellan samtidiga
requests, missvisande cookie- och integritetstexter, inaktuell driftinformation
och beroendesårbarheter som inte stoppade releasekedjan.

## Resultat

Koden och dokumentationen beskriver samma dataflöde, kritiska beroendefynd
stoppar CI och Worker-driften får bättre, explicit telemetri utan att nya
marknadsföringscookies införs.
