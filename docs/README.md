# Nova IT – dokumentation

Det här är navet för projektets tekniska och historiska dokumentation.

## Läsordning

1. [Projektstatus](project-status.md) – nuläge och närmaste steg.
2. [Sammanfattande projektlogg](PROJECT_MILESTONES.md) – kort, läraranpassad överblick över de större arbetsperioderna.
3. [Projekthistorik](project-history.md) – den förklarande resan från idé till fungerande webbplats.
4. [Changelog](CHANGELOG.md) – spårbara förändringar med permanenta `NOVA-xxxx`-ID:n.
5. [Beslutslogg](DECISIONS.md) – större vägval, alternativ och konsekvenser.
6. [Säkerhetsdrift och incidentrutin](sakerhetsdrift-runbook.md) – praktisk
   runbook för incidenter, nyckelrotation, återställning och gallring.
7. [Arbetsflöde för dokumentation](documentation-workflow.md) – hur framtida uppdateringar fångas.
8. [Deploy och drift](deployment.md) – bygg, verifiering och publicering.
9. [Roadmap](roadmap.md) – planerat arbete.

## Tre nivåer av historik

- `PROJECT_MILESTONES.md` är den korta versionen för lärare, presentationer och snabb överblick.
- `project-history.md` beskriver projektets utveckling, sammanhang och lärdomar.
- `CHANGELOG.md` spårar större tekniska förändringar med permanenta ID:n.

## Dokumentationsprincip

Nova IT dokumenterar inte bara _vad_ som ändrades. En större post ska även förklara:

- varför förändringen behövdes,
- vilket problem eller mål den hörde till,
- vilka system som berördes,
- vilket resultat den gav,
- och vad som fortfarande är osäkert eller återstår.

Git-historiken är den tekniska sanningskällan för kod. Dokumenten här gör historiken begriplig utan att läsaren behöver tolka varje commit.

## Säkerhetsregel

Lägg aldrig API-nycklar, lösenord, kunduppgifter, privata e-postinställningar eller andra hemligheter i dokumentationen.
