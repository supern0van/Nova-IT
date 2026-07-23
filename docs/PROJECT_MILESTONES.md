# Nova IT – sammanfattande projektlogg

Det här dokumentet är den korta, läraranpassade projektloggen. Den sammanfattar större arbetsperioder och resultat utan att gå ner på commitnivå eller beskriva varje enskild förändring.

För full bakgrund och tekniska detaljer, se [projekthistoriken](project-history.md), [changeloggen](CHANGELOG.md) och [beslutsloggen](DECISIONS.md).

## 1. Idé, inriktning och grund

Nova IT utvecklades som en idé för praktisk IT-hjälp till privatpersoner, mindre företag och föreningar. Projektet fick tidigt fokus på tydliga tjänster inom support, datorer, nätverk, installationer, säkerhet och återbruk av datorer.

Under den här fasen formulerades verksamhetsinriktningen, målgruppen och den första strukturen för webbplatsen. Domän och webbhotell införskaffades för att ge projektet en riktig publik identitet.

## 2. Första webbplatsen och Lovable

Den första fungerande webbplatsen byggdes med Lovable. Det gjorde det möjligt att snabbt gå från idé till ett visuellt och klickbart projekt med sidor för tjänster, information, kontakt och support.

Arbetet visade samtidigt behovet av större kontroll över kod, versionshistorik och framtida utveckling. Därför kopplades projektet vidare till GitHub.

## 3. GitHub som projektets huvudkälla

GitHub blev projektets centrala plats för kod, dokumentation och versionshistorik. Det gav möjlighet att arbeta med brancher, granska ändringar och bevara projektets utveckling på ett mer professionellt sätt.

Projektet fick även tydligare rutiner för test, typkontroll, lint och produktionsbygge. `main` definierades som den stabila version som ska motsvara den publika webbplatsen.

## 4. Ny driftlösning och domänstruktur

Den publika webbplatsen flyttades till Cloudflare Workers. `nova-it.se` blev huvuddomän, medan övriga domänvarianter omdirigeras dit.

Cloudflare används för HTTPS, DNS och publik drift. Äldre webbpekningar togs bort försiktigt för att inte påverka e-postens DNS-inställningar.

## 5. Visuell och funktionell omarbetning

Webbplatsens visuella uttryck gjordes om till en mörkare, tydligare och mer sammanhållen design. Struktur och innehåll för startsida, tjänster, arbetsflöde, FAQ, om-sida och kontakt förbättrades.

Tjänsteval kopplades till kontaktflödet så att användaren får rätt förval när ett ärende startas. Målet var att webbplatsen skulle kännas som ett fungerande verktyg och inte bara som en statisk presentation.

## 6. Supportassistent

En lokal och regelbaserad supportassistent utvecklades för att hjälpa användaren att beskriva sitt problem, sortera ärendet och gå vidare till kontakt.

Assistenten ersatte en tidigare mer dekorativ robotlösning. Den nya versionen prioriterar tydlighet, trygg eskalering och ett användbart kontaktunderlag framför att försöka framstå som en fullständig AI-tjänst.

## 7. Kvalitet, struktur och framtida utveckling

Projektet har fått automatiska kvalitetskontroller för tester, lint, typkontroll och build. Dokumentation har också byggts ut för drift, arbetsflöde, design, integrationer och framtida portal.

En framtida kund- och adminportal har planerats som ett separat system med egen drift, databas och releasecykel. Kontaktformulär och supportassistent kan senare kopplas till backend eller ärendesystem.

## 8. Dokumentationssystem

Ett dokumentationssystem med tre nivåer har införts:

1. En full projekthistorik som beskriver bakgrund, problem, beslut och lärdomar.
2. En teknisk changelog med permanenta `NOVA-xxxx`-ID:n för större förändringar.
3. Den här sammanfattande projektloggen för lärare, presentationer och snabb överblick.

GitHub kontrollerar automatiskt att betydande kodförändringar också får ett kort loggunderlag. Den detaljerade historiken skrivs däremot manuellt för att undvika felaktiga eller påhittade förklaringar.

## Nuvarande läge

Nova IT har en fungerande publik webbplats, egen domänstruktur, Cloudflare-drift, GitHub-baserat arbetsflöde, supportassistent, kontaktflöde och grundläggande automatiska kvalitetskontroller.

Nästa större steg är att färdigställa kundtexter och tjänsteprioritering, verifiera e-postens DNS, genomföra en mer fullständig tillgänglighets- och mobilgranskning samt avgöra hur kontaktärenden ska hanteras i ett framtida backend- eller ärendesystem.
