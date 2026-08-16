# Utkast: personuppgiftsbiträdesavtal

Detta är ett arbetsutkast för situationer där Nova IT behandlar personuppgifter för en kunds räkning. Avtalet ska anpassas efter den aktuella tjänsten, behandlingen och eventuella underbiträden innan det undertecknas.

## 1. Parter och behandling

Den personuppgiftsansvarige är kunden. Nova IT är personuppgiftsbiträde när Nova IT behandlar personuppgifter enligt kundens dokumenterade instruktioner. Avtalets ändamål, behandlingens varaktighet, kategorier av registrerade och typer av personuppgifter ska beskrivas i en tjänstespecifik bilaga.

**Bilaga A är obligatorisk.** Artikel 28.3 kräver att föremålet, varaktigheten, arten och ändamålet med behandlingen, typen av personuppgifter och kategorierna av registrerade anges. Ett biträdesavtal utan ifylld bilaga uppfyller alltså inte kravet. Mall för bilagan finns sist i detta dokument.

## 2. Dokumenterade instruktioner

Nova IT får endast behandla personuppgifter för de ändamål och på det sätt som följer av kundens dokumenterade instruktioner. Om en instruktion enligt Nova IT:s bedömning strider mot dataskyddsförordningen ska kunden informeras innan behandlingen fortsätter, om inte lag kräver annat.

## 3. Säkerhet och sekretess

Nova IT ska vidta lämpliga tekniska och organisatoriska åtgärder med hänsyn till behandlingens risker. Personer som får tillgång till personuppgifter ska omfattas av sekretess och endast få tillgång till uppgifter som behövs för deras arbetsuppgifter.

## 4. Underbiträden

Nova IT får anlita underbiträden endast efter kundens föregående skriftliga godkännande eller enligt en skriftlig generell auktorisation med möjlighet för kunden att invända mot ändringar. Nova IT ska säkerställa att underbiträdet omfattas av motsvarande dataskyddsskyldigheter.

## 4 a. Överföring till tredjeland

Nova IT får inte överföra personuppgifter till ett land utanför EU/EES, eller
till en internationell organisation, utan kundens dokumenterade instruktion och
utan att en giltig överföringsgrund enligt kapitel V i dataskyddsförordningen
föreligger.

Sker överföring ska grunden anges — beslut om adekvat skyddsnivå,
standardavtalsklausuler eller annan grund — tillsammans med de kompletterande
skyddsåtgärder som bedömts nödvändiga. Nova IT ska på begäran redovisa vilka
underbiträden som behandlar uppgifter utanför EU/EES och på vilken grund.

> Anmärkning inför granskning: Nova IT anlitar i dag Cloudflare, Supabase och
> Resend, samtliga med global infrastruktur. Den här punkten är därför inte
> teoretisk och behöver fyllas i med faktisk överföringsgrund per leverantör.
> Se `juridisk-granskning-underlag.md` avsnitt 3.

## 5. Incidenter och stöd

Nova IT ska utan onödigt dröjsmål informera kunden om en personuppgiftsincident och lämna den information som rimligen behövs för att kunden ska kunna fullgöra sina skyldigheter. Nova IT ska även bistå kunden med registrerades rättigheter, säkerhetsbedömningar och kontakter med tillsynsmyndighet i den utsträckning som krävs och är rimlig.

## 6. Radering eller återlämnande

När tjänsten upphör ska Nova IT, enligt kundens val, radera eller återlämna personuppgifterna och radera befintliga kopior, om inte lag kräver fortsatt lagring. Kunddata som inte omfattas av en rättslig lagringsskyldighet ska raderas senast 30 dagar efter avslutad tjänst.

## 7. Granskning

Nova IT ska ge kunden den information som behövs för att visa att skyldigheterna i avtalet är uppfyllda och möjliggöra granskningar enligt dataskyddsförordningen, med rimlig hänsyn till säkerhet, sekretess och andra kunders information.

## 8. Tillägg och lagval

Ändringar ska göras skriftligen. Avtalet ska tolkas tillsammans med huvudavtalet och tillämplig dataskyddslagstiftning. Vid konflikt gäller den bestämmelse som ger den registrerade bäst skydd, i den utsträckning det är förenligt med tvingande lag.

---

## Bilaga A — beskrivning av behandlingen

Fylls i per kund och tjänst. Utan ifylld bilaga uppfyller avtalet inte artikel 28.3.

| Fält | Ifylls med | Exempel för ett typiskt Nova IT-uppdrag |
| ---- | ---------- | --------------------------------------- |
| Föremål för behandlingen | Vilken tjänst det gäller | Felsökning och service av kundens arbetsstationer |
| Behandlingens varaktighet | Uppdragets längd | Under uppdraget samt högst 30 dagar därefter |
| Behandlingens art | Vilka åtgärder som utförs | Åtkomst, läsning, kopiering vid säkerhetskopiering, radering |
| Ändamål | Varför | Att utföra avtalad IT-tjänst åt kunden |
| Typ av personuppgifter | Vilka uppgifter som kan förekomma | Namn, e-post, kontaktuppgifter, innehåll i filer och e-post på utrustningen |
| Kategorier av registrerade | Vems uppgifter | Kundens anställda, kundens egna kunder, kontaktpersoner |
| Särskilda kategorier | Förekommer artikel 9-uppgifter? | Normalt nej — om ja krävs särskild bedömning |
| Underbiträden | Namn och roll | Anges vid behov, se punkt 4 |
| Överföring till tredjeland | Sker överföring, och på vilken grund? | Se punkt 4 a |

### Anmärkning om åtkomst till hela lagringsmedier

Vid service av en dator eller en disk får Nova IT i praktiken teknisk åtkomst
till **allt** som finns på enheten, inte bara det som är relevant för
uppdraget. Det innebär att typen av personuppgifter och kategorierna av
registrerade sällan går att avgränsa exakt i förväg.

Bilagan bör därför beskriva åtkomsten som den faktiskt är, i stället för att
räkna upp en lista som ser snävare ut än verkligheten. Punkt 2 om dokumenterade
instruktioner och punkt 3 om sekretess är det som begränsar vad Nova IT får
göra med åtkomsten.

> Detta dokument är ett utkast och ersätter inte juridisk granskning. Bilaga A
> ska fyllas i per uppdrag innan avtalet undertecknas.
