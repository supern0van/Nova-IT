---
id: NOVA-0061
date: 2026-08-21
date_precision: day
type: changed
status: completed
systems:
  - public-site
  - support-assistant
---

# Supportassistenten sattes offline

## Vad ändrades?

Den flytande supportassistenten och länken i sidfoten döljs via en gemensam
huvudbrytare. Den separata sidan `/assistent` visar ett offline-läge med länk
till kontaktformuläret. Assistentens publika serverfunktioner nekar samtidigt
anrop så att ingen AI-tjänst används när funktionen är avstängd.

## Varför?

Nova IT:s automatiska ärendeguide ska vara tillfälligt otillgänglig utan att
den vanliga kontaktvägen påverkas.

## Resultat

Besökare ser inte längre boten på webbplatsen. Den som öppnar en gammal direktlänk
till ärendeguiden får ett tydligt offline-besked och kan gå vidare till
kontaktformuläret utan att någon guidekonversation försöker läsas in.
Guideöverlämningar markeras separat från vanliga länkar till kontaktformuläret,
så ett meddelande om saknad konversation visas bara efter ett riktigt guideflöde.

## Dokumentationspåverkan

Ingen.
