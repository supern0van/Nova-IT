# Kundomdömen och kundcase – beslutsunderlag

Status: internt underlag, inget nytt omdöme får publiceras ännu.

## Nuläge i repot

- `/case-study` omdirigerar till `/arbetssatt`.
- Det enda dokumenterade exemplet är Projekt Återbruk. Sajten anger uttryckligen
  att det är ett LIA-/utbildningsprojekt och inte en kundreferens.
- `ProjectProof` är därför metod-/erfarenhetsbevis, inte ett betygs- eller
  citatblock.
- Ingen publik komponent för stjärnbetyg, kundcitat eller recensionsflöde finns.

## Rekommendation

Inför inte generiska stjärnor eller anonyma citat. Börja med högst 2–3
verifierade, korta kundreferenser när skriftligt godkännande finns. Varje case
bör visa vad som gjordes, ungefärlig omfattning och resultat utan att avslöja
mer kundinformation än nödvändigt.

Föreslagen struktur: tjänsteområde → kundens godkända formulering → konkret
insats/resultat → kundtyp eller ort endast om kunden godkänt det → datum för
senaste kontroll. Märk tydligt om texten är redigerad eller sammanfattad.

## Publiceringsspärr

Inget namn, företagsnamn, logotyp, foto, ort, skärmbild eller identifierbart
kundcase får publiceras utan dokumenterat tillstånd från rätt kundkontakt.
Tillståndet ska ange kanaler (webb/sociala medier), exakt text/material,
användningsperiod och hur återkallelse hanteras. Ett muntligt "det går bra"
utan spårbar bekräftelse räcker inte som arbetsrutin.

Undvik känsliga uppgifter och detaljer som kan avslöja säkerhetsproblem,
systemmiljö, adress eller incidenthistorik. Publicera inte påhittade eller
redaktionellt fabricerade omdömen och köp inte recensioner.

## Juridisk och trovärdighetsmässig kontroll

Konsumentverket rekommenderar att konsumenter inte bara läser omdömen på
företagets egen webbplats; egna referenser bör därför kompletteras med en väg
 till oberoende omdömen när sådana faktiskt finns. Marknadsföringspåståenden
 måste kunna styrkas. IMY:s vägledning innebär att publicering av identifierande
 kunduppgifter behöver en dokumenterad rättslig grund; samtycke ska vara frivilligt,
 informerat, specifikt och möjligt att återkalla.

Källor: [Konsumentverket om att jämföra omdömen](https://www.konsumentverket.se/fragor-och-svar/3087657/jag-ska-laga-min-bil-pa-verkstad-vad-ska-jag-tanka-pa/),
[Konsumentverket om marknadsföring och prisinformation](https://www.konsumentverket.se/for-foretag/prissattning-och-ta-betalt/),
[IMY om samtycke](https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/rattslig-grund/samtycke/).

## Beslut som krävs

1. Ska Nova samla in omdömen från nuvarande kunder, eller endast använda
   oberoende plattformar?
2. Ska kundens namn/företag visas, eller ska alla referenser vara helt
   avidentifierade?
3. Ska publicering ske först när företaget är live, i linje med prislogiken?
4. Vem godkänner slutlig text och följer upp återkallelser?
## Trolig Google-tolkning

Om avsikten är att kundomdömen ska kunna kopplas till Google är den säkraste
första versionen en vanlig knapp till Nova IT:s Google Business Profile, till
exempel "Se våra Google-omdömen" eller "Lämna ett omdöme på Google". Google
erbjuder en delbar recensionslänk/QR-kod och kräver genuina kundupplevelser;
incitament i utbyte mot positiva omdömen är förbjudna.

Ett automatiskt recensionsblock som hämtar och visar Google-recensioner är en
separat, tyngre lösning. Google Business Profile API kräver registrerad app och
OAuth 2.0-uppgifter. Det bör därför vänta tills företagsprofilen är verifierad,
rättigheterna är klara och serverbaserad cache/uppdatering är beslutad. Hårdkoda
inte betyg eller enskilda recensioner i sajten.

