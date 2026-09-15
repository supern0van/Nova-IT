# Prisunderlag for priskalkylator och prisintervall

Status: beslutsunderlag, inte publiceringsklart prisbeslut  
Datum for research: 2026-08-27 till 2026-08-28  
Scope: Nova IT:s publika tjanster i `src/lib/nova-data.ts`

## Slutsats

Nova IT bor visa pris som prisindikation, inte bindande fast offert. Marknaden
i Stockholm ar spretig: privat hembesok ligger ofta omkring 599-800 kr/timme
efter RUT eller fasta paket pa 699-1 399 kr efter RUT, medan foretagsstod ofta
ligger omkring 899-1 280 kr/timme exkl. moms. Verkstads-/butiksjobb ligger
lagre per arende, ofta cirka 299-995 kr beroende pa jobb.

Rekommendationen ar att Nova IT lagger sig tydligt men inte billigast:

- Privat hembesok: fran 795 kr efter RUT for forsta timmen i karnomradet.
- Privat fjarrsupport: 495 kr per 30 minuter inkl. moms, ingen RUT.
- Verkstads-/drop-off-diagnos: 695 kr inkl. moms.
- Foretag fjarrsupport: 995 kr/timme exkl. moms, 30 min minsta debitering.
- Foretag platsbesok: 1 150 kr/timme exkl. moms, 1 timme minsta debitering.
- Specialistarbete for Microsoft 365, Google Workspace, sakerhet och migration:
  1 250 kr/timme exkl. moms.

Detta ger en prisbild som ar begriplig for kund, konkurrenskraftig mot de
stora hembesoksaktorernas RUT-priser och mer hallbar an de allra lagsta
kampanjliknande priserna.

## Viktiga regler och antaganden

- RUT ska bara anvandas for privatkund nar arbetet utforts i eller nara
  bostaden och avser godkanda IT-arbeten. Skatteverket anger 50 procent av
  arbetskostnaden, men inte material, resor eller administration.
- Telefon-, e-post- och fjarrsupport ska inte visas med RUT-avdrag.
- Konsumentpriser ska anges som totalpris inklusive moms nar det ar praktiskt
  mojligt. Om priset inte kan anges i forvag ska grunden for hur priset raknas
  fram vara tydlig.
- Kalkylatorns resultat bor kunna fungera som ett tydligt skriftligt underlag:
  prisintervall, antaganden, tillagg och vad som inte ingar ska sparas i samma
  vy/text.
- Material, licenser, reservdelar, parkering, trangselskatt och resa utanfor
  karnomradet ska visas som tillagg eller offert.
- Foretagspriser ska visas exkl. moms.
- Privatpriser ska visas inkl. moms och, dar RUT kan galla, som "efter RUT"
  med bruttopris i detaljtext.

## Fordjupad verifieringsmetod

Kallorna har delats upp i fyra viktklasser:

- Primara regler: Skatteverket for RUT och arbetsgivaravgifter,
  Konsumentverket for konsumentpris/prisunderlag och SCB for loneankare.
- Primara leverantorslistor: Microsoft och Google for licensbasen.
- Direkta konkurrentpriser: publika prislistor fran IT-support-, natverks-,
  hembesoks- och reparationsaktorer i Stockholm/Sverige.
- Marknadssignaler: konsultmarknadsplatser, ramavtal och leverantorspaket som
  inte ska kopieras rakt av men anvands som rimlighetskontroll.

Osakra rader i observationsfilen ar markerade med "antaget" eller "verifiera"
i `moms_rut` eller `notering`. De ska inte publiceras som fakta innan en ny
manuell kontroll av respektive sida. De anvands bara for intervallanalys.

## Rekommenderad grundmodell

| Prisrad | Rekommenderat pris | Kommentar |
| --- | ---: | --- |
| Privat hembesok, forsta timmen | 795 kr efter RUT | Bor kunna beskrivas som arbetskostnad + lokal service-/reseandel. |
| Privat hembesok, efterfoljande tid | 313 kr per 30 min efter RUT | Bygger pa 1 250 kr/timme inkl. moms i arbetskostnad. |
| Privat fjarrsupport | 495 kr per 30 min inkl. moms | Ingen RUT. |
| Verkstadsdiagnos/drop-off | 695 kr inkl. moms | Kan krediteras helt eller delvis vid reparation om Nova IT vill. |
| Foretag fjarrsupport | 995 kr/timme exkl. moms | Debitering per paborjad 30 min. |
| Foretag platsbesok | 1 150 kr/timme exkl. moms | Minsta debitering 1 timme. |
| Specialistarbete | 1 250 kr/timme exkl. moms | Microsoft 365, Google Workspace, sakerhet, migration, avancerat natverk. |

## Prisintervall per publik tjanst

| Tjanst | Privat rekommenderat intervall | Foretag rekommenderat intervall | Kalkylatorlogik |
| --- | ---: | ---: | --- |
| IT-support | 795-2 045 kr efter RUT hemma, eller 495 kr/30 min fjarr | 995-3 450 kr exkl. moms | 1-3 timmar beroende pa antal problem och leveranssatt. |
| Natverk och Wi-Fi | 795-1 420 kr efter RUT for felsok/optimering, 1 095-1 395 kr efter RUT for router/mesh | 2 300-5 750 kr exkl. moms for enkel genomgang/setup | Fast startpaket for router/mesh, timme/offert for kablage och komplexa miljöer. |
| Datorinstallation | 1 395 kr efter RUT for startklar dator, 1 395-2 670 kr efter RUT med filflytt | 2 300-3 450 kr exkl. moms per arbetsstation | Paketpris upp till cirka 2 timmar, tillagg for data, skrivare, flera konton. |
| Felsokning | 695 kr verkstadsdiagnos, 795-2 045 kr efter RUT hemma, 495 kr/30 min fjarr | 995-3 450 kr exkl. moms | Separera diagnos, akut/express och faktisk atgard. |
| Sakerhet och backup | 1 420-2 670 kr efter RUT for lokal genomgang dar RUT ar tillampligt | 4 900-7 500 kr exkl. moms for liten baslinje, lopande skydd offert | Visa bara arbetsintervall publikt; licenser/backup ansvar offereras separat. |
| Microsoft 365 / Google Workspace | 795-1 420 kr efter RUT for enklare konto/e-post hemma, 495 kr/30 min fjarr utan RUT | 2 500-4 900 kr exkl. moms for enkel uppsattning, 4 900-9 900 kr for mindre migration | Licenser visas som pass-through eller "fran" baserat pa Microsoft/Google-listpriser. |
| Datorservice och uppgradering | 695 kr diagnos, 595-1 295 kr arbete exkl. reservdelar beroende pa jobb | 995-3 450 kr exkl. moms plus delar | Verkstadspaket for standardjobb, offert for skarm, moderkort, dataraddning. |

## Rekommenderade kalkylatorregler

Kalkylatorn bor heta "Prisindikation" och krava dessa val:

- Kundtyp: privat eller foretag.
- Tjanst: samma sju tjanster som pa sajten.
- Leverans: hemma/plats, fjarr, verkstad/drop-off eller offert.
- Omfattning: liten, normal, avancerad.
- Antal enheter/anvandare: anvands for datorinstallation, avtal, M365/Google och backup.
- RUT: visas bara for privat hemma/plats nar arbetet kan omfattas av RUT.
- Omrade: karnomrade, ovriga Stockholm, utanfor ordinarie omrade.
- Bradska: normal eller express. Express kan vara +50 procent efter aktivt val.

Resultatet bor visa:

- ett intervall, inte ett exakt slutpris;
- vad som ingar;
- vilka tillagg som kan tillkomma;
- en tydlig text om att slutpris bekraftas innan arbetet startar.
- datum for prisindikationen, sa att gamla kalkylresultat inte ser permanenta ut.

## Sidor som inte bor fa fast pris direkt

Publicera inte fasta priser for dessa utan manuell offert:

- sakerhetsincidenter, intrang, ransomware och misstankt datalackage;
- dataraddning fran trasig disk;
- komplex kabeldragning eller fastighetsnat;
- e-post-/fil-/tenantmigration med oklar datamangd;
- lopande backup- och sakerhetsansvar utan beslutad leverantor, SLA och villkor.

## Kallbas

Detaljer finns i `docs/prisobservationer-2026-08-27.csv`. Viktigaste
kalltyper:

- Lokala och nationella konkurrenter: Natverkstekniker Stockholm, Min
  Datorsupport, Datorhjalp Hemma, Smartify, Hemfixarna, TechBuddy,
  Installexpress, IT247/Datorreparation och TeknikFix.
- Verkstad/butik: Inet, Hevtech, DataOne, PCbutiken Bromma och Elgiganten.
- Foretagsavtal och drift: Telia, Adminor och Datakraft IT.
- Licens- och leverantorspriser: Microsoft, Google Workspace, Microsoft Backup,
  IT Foretaget, Update och GNS/Acronis.
- Kostnadsankare: SCB lonedata och Skatteverkets arbetsgivaravgift.
- Regelankare: Skatteverkets RUT-regler for IT-tjanster och fjarrsupport.
- Konsumentregelankare: Konsumentverkets information om prisinformation,
  konsumenttjanstlagen och vikten av tydligt skriftligt prisunderlag.

## Beslut som kravs innan implementation

1. Valj om Nova IT ska positioneras som "rimligt premium" enligt ovan eller som
   lagprisaktor.
2. Bekrafta om forsta privatbesoket ska vara 795 kr efter RUT, eller om det ska
   vara 699 kr for att ligga narmare Smartify/Hemfixarna.
3. Bekrafta om fjarrsupport ska vara 495 kr/30 min eller 395 kr/30 min.
4. Besluta om verkstadsdiagnos ska krediteras vid genomford reparation.
5. Besluta vilka omraden som ingar i "karnomrade" utan extra resepost.
6. Besluta om lopande supportavtal ska publiceras nu eller vanta tills SLA,
   oppettider och ansvar ar satta.

Nar detta ar godkant kan prisdatat implementeras centralt, till exempel i
`src/lib/pricing-data.ts`, och sedan ateranvandas pa tjanstesidor,
prisindikator/kalkylator och supportassistentens kunskapsbas.
## Intern prislogik efter kundmängd

**Miljöregel:** Prislogiken och tabellserierna är endast intern planering under
utveckling. De ska inte exponeras i publik routing, sidmetadata, sitemap,
kundflöden, kontaktformulär eller klientbundle som kan nås från hemsidan.
Eventuell dev-visning ska ligga bakom utvecklaråtkomst och får inte användas som
kundpris. Aktivering mot live ska ske först efter separat ägarbeslut,
publiceringskontroll och verifiering av den då aktuella prisinformationen.

Detta är en intern styrmodell, inte en publiceringsfärdig prislista. Syftet är
att behålla en lågprisprofil mot kund och samtidigt skydda en liten firma från
att sälja för många obetalda timmar. Kundmängd ska därför inte automatiskt ge
lägre timpris; rabatt ska bara ges när den minskar sälj-, rese- eller
administrationskostnad eller ger förutsägbar återkommande beläggning.

### Kostnadsmodell som måste fyllas med Novas faktiska siffror

| Variabel | Startantagande | Kontroll |
| --- | ---: | --- |
| Debiterbar andel av arbetstid | 55–65 % | Restid, offert, bokning, inköp och administration är inte debiterbara. |
| Minsta privatdebitering på plats | 1 timme | Skyddar små jobb från att bli förlustaffärer. |
| Minsta företagsdebitering på plats | 1 timme | Täcker resa, etablering och dokumentation. |
| Prisgolv privat på plats | 795 kr efter RUT | Underskrids bara om ett standardiserat paket minskar tidsåtgången. |
| Prisgolv fjärrsupport | 495 kr per 30 min | Fjärrtid har fortfarande sälj- och administrationskostnad. |
| Prisgolv företag | 995 kr/timme exkl. moms | Kontroll mot risk, ej debiterad tid och faktisk marginal. |
| Månatlig buffert | 10–15 % av omsättning | Ska täcka svagare månader, reklamationer och utrustning. |

Intern kontrollformel: `täckningsbidrag = fakturerad omsättning - direkta
kostnader - kostnad för ej debiterad arbetstid`. Om bidraget blir för lågt ska
scope, resa, expressgrad eller inkluderade moment ändras före en prissänkning.

### Serie A – försiktig start (0–15 aktiva kunder)

| Prisrad | Riktpunkt | Villkor |
| --- | ---: | --- |
| Privat hembesök | 795 kr efter RUT | Kärnområde och normal bokning. |
| Privat fjärrsupport | 495 kr/30 min | Ingen rabatt på enstaka ärenden. |
| Verkstadsdiagnos | 695 kr | Högst 50 % kredit vid reparation om Nova vill använda det. |
| Företag fjärrsupport | 995 kr/timme exkl. moms | Minst 30 minuter per tillfälle. |
| Företag platsbesök | 1 150 kr/timme exkl. moms | Minst 1 timme; resa utanför kärnområde som tillägg. |
| Specialistarbete | 1 250 kr/timme exkl. moms | Ingen start-rabatt vid migration eller säkerhetsrisk. |

Mål: 20–30 debiterbara timmar per månad och minst 70 % uppdrag med tydligt
avgränsat scope.

### Serie B – balanserad tillväxt (16–50 aktiva kunder)

| Prisrad | Riktpunkt | Villkor |
| --- | ---: | --- |
| Privat hembesök | 795 kr efter RUT | Paketera flera uppgifter utan att sänka timvärdet. |
| Privat fjärrsupport | 475–495 kr/30 min | 475 kr endast vid minst två bokade block. |
| Verkstadsdiagnos | 695 kr | Full kredit endast för standardiserad reparation. |
| Företag fjärrsupport | 995–1 050 kr/timme exkl. moms | Lägre nivå för planerad support, högre för ad hoc. |
| Företag platsbesök | 1 150 kr/timme exkl. moms | Rabatt endast via förbetalt block med slutdatum. |
| Specialistarbete | 1 250–1 350 kr/timme exkl. moms | Högre nivå för akut eller komplext arbete. |

Mål: 45–70 debiterbara timmar per månad, minst 25 % återkommande intäkt och
10 % buffert efter direkta kostnader.

### Serie C – hög volym (51–100+ aktiva kunder)

| Prisrad | Riktpunkt | Villkor |
| --- | ---: | --- |
| Privat hembesök | 845–895 kr efter RUT | 795 kr kan behållas för planerade tider; kort ledtid kostar mer. |
| Privat fjärrsupport | 495–545 kr/30 min | 545 kr samma dag eller express. |
| Verkstadsdiagnos | 695–795 kr | Högre nivå vid express. |
| Företag fjärrsupport | 1 050–1 150 kr/timme exkl. moms | Högre nivå för akut eller arbete utanför tider. |
| Företag platsbesök | 1 250 kr/timme exkl. moms | Minst 1 timme; dölj inte restid i rabatt. |
| Specialistarbete | 1 350–1 500 kr/timme exkl. moms | Övre spannet för hög risk eller komplex migration. |

Mål: 80–110 debiterbara timmar per månad endast om administration,
dokumentation och återhämtning ryms. Vid över 75 % beläggning tre månader i rad
prioriteras ledtid och paket framför fler lågprisjobb.

### Prisbeslut och månadsuppföljning

För återkommande planerad volym får effektiv rabatt vara högst 5 % och bara
mot förbetalt, tidsbegränsat block. Akut arbete får ett expresspåslag på 25–50 %.
Resa utanför kärnområde ska vara separat post eller offert. Följ varje månad
fakturerade timmar, faktisk arbetstid, debiteringsgrad, ordervärde, återkommande
andel, restid, delar/licenser, reklamationer och täckningsbidrag. Justera först
efter tre månaders verkliga data; växande kundantal är inte i sig skäl att sänka
priset.
