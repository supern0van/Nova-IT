# Arbetsflöde för dokumentation

Målet är att dokumentationen ska följa projektet utan att varje liten commit skapar administrativt arbete.

## När behövs ett changelog-fragment?

Skapa ett fragment när ändringen påverkar minst en av följande:

- publik funktion eller text,
- design eller navigation,
- domän, DNS, e-post eller hosting,
- deploy, CI eller säkerhet,
- viktig dependency eller arkitektur,
- verksamhetsinriktning eller större beslut.

Rena stavfel, formatering och interna refactors utan beteendeförändring behöver normalt inget fragment.

## Skapa fragment

Kopiera `docs/changes/_template.md` till ett beskrivande namn:

```text
docs/changes/NOVA-0011-kort-beskrivning.md
```

Fyll i:

- vad som ändrades,
- varför det gjordes,
- resultatet,
- berörda system,
- om andra dokument behöver uppdateras.

Nästa lediga `NOVA-xxxx`-ID tas från `docs/CHANGELOG.md`. Ett ID får aldrig återanvändas.

## Pull request

PR-mallen frågar efter dokumentationspåverkan. För en betydande ändring ska PR:n innehålla ett fragment. GitHub Actions kontrollerar detta automatiskt.

## Release eller produktionsdeploy

Före en godkänd release:

1. Kör `bun run ci`.
2. Granska hela skillnaden mot den nuvarande produktionsversionen.
3. Sammanställ färdiga fragment i `docs/CHANGELOG.md`.
4. Uppdatera `docs/project-history.md` endast när förändringen är en faktisk milstolpe.
5. Uppdatera `docs/DECISIONS.md` endast när ett större vägval har gjorts.
6. Ta bort eller arkivera de fragment som har förts in i changelogen.
7. Deploya först därefter.

## Vad automationen gör

Workflowen `Documentation guard`:

- validerar att kärndokumenten finns,
- kontrollerar formatet på changelog-fragment,
- kräver fragment när en PR ändrar betydande delar av projektet,
- tillåter etiketten `skip-changelog` för dokumenterade undantag,
- skriver aldrig automatiskt om historiska dokument.

## Vad någon fortfarande måste göra

Automation kan upptäcka att dokumentation saknas, men den kan inte säkert förstå hela orsaken bakom en ändring. Den som gör ändringen behöver därför skriva några meningar i fragmentet. Vid arbete tillsammans med en AI-assistent ska dokumentationsuppdateringen ingå i samma uppdrag som kodändringen.