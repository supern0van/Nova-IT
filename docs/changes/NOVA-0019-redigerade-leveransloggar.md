---
id: NOVA-0019
date: 2026-08-03
type: security
scope: logging
---

## Vad ändrades?

Loggningen kring publikt ärendeintag, Resend-utskick och 46elks-SMS redigerades
så att externa svarskroppar inte skrivs till driftloggar.

## Varför?

Leverantörers felmeddelanden kan innehålla mottagare, meddelandedetaljer eller
andra personuppgifter. Statuskod och känd kontext räcker för driftfelsökning
utan att riskera onödig dataexponering i loggar.

## Resultat

Misslyckade e-post-, SMS- och intagsanrop fortsätter att faila eller soft-faila
som tidigare, men loggar bara status och redigerad diagnostik.
