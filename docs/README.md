# Nova IT – dokumentation

Det här är navet för projektets tekniska och historiska dokumentation.

## Läsordning

1. [Projektstatus](project-status.md) – nuläge och närmaste steg.
2. [Projekthistorik](project-history.md) – den förklarande resan från idé till fungerande webbplats.
3. [Changelog](CHANGELOG.md) – spårbara förändringar med permanenta `NOVA-xxxx`-ID:n.
4. [Beslutslogg](DECISIONS.md) – större vägval, alternativ och konsekvenser.
5. [Arbetsflöde för dokumentation](documentation-workflow.md) – hur framtida uppdateringar fångas.
6. [Deploy och drift](deployment.md) – bygg, verifiering och publicering.
7. [Roadmap](roadmap.md) – planerat arbete.

## Dokumentationsprincip

Nova IT dokumenterar inte bara *vad* som ändrades. En större post ska även förklara:

- varför förändringen behövdes,
- vilket problem eller mål den hörde till,
- vilka system som berördes,
- vilket resultat den gav,
- och vad som fortfarande är osäkert eller återstår.

Git-historiken är den tekniska sanningskällan för kod. Dokumenten här gör historiken begriplig utan att läsaren behöver tolka varje commit.

## Säkerhetsregel

Lägg aldrig API-nycklar, lösenord, kunduppgifter, privata e-postinställningar eller andra hemligheter i dokumentationen.