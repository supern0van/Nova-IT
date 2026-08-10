---
id: NOVA-0035
date: 2026-08-10
area:
  - repository
  - adminportal
  - kundportal
---

# Portalerna flyttades till privat repo

Adminportalen och kundportalen ligger nu i det privata repot
`supern0van/Nova-IT-Portaler`.

Det publika `Nova-IT`-repot innehåller efter denna ändring bara den publika
webbplatsen och dess dokumentation. Den tidigare `portal/`-mappen, adminportalens
CI-jobb och dess manuella deploy-workflow togs bort härifrån för att hålla den
interna portalkoden borta från public repo.

Ny lokal arbetsyta:

```text
D:\Nova IT Arbetsyta\Nova IT Portaler\adminportal
D:\Nova IT Arbetsyta\Nova IT Portaler\kundportal
```

Ingen produktion deployades av denna ändring.
