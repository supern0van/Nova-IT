---
id: NOVA-0038
date: 2026-08-16
date_precision: day
type: changed
status: completed
systems:
  - publik-webbplats
  - adminportal
---

# Supportassistenten fick bredare förståelse och blev en ärendelogg

## Vad ändrades?

Kunskapsbasen gick från 12 till 17 områden. De fem nya täcker skärm och bild,
videomöten med kamera och ljud, extern hårddisk och USB, genomgång och
rengöring samt nätverk för kontor och förening. Samtliga nyckelordslistor
breddades med vardagliga formuleringar, engelska låneord och vanliga
stavvarianter. Tjänsten `datorservice` går nu att träffa från guiden.

Matchningen känner igen svenska böjningsformer genom en enkel stemmer som
även kollapsar dubblerad slutkonsonant. Angelägenheten höjs av uttryck för
att arbetet står still och av tecken på begynnande datahaveri, utan att
kategorin ändras.

Överlämningen till kontaktformuläret bär ett `transcript`-fält (version 3)
med kundens egna ord och de val som gjorts i guiden. Det komponeras in i
ärendets beskrivning och når adminportalen via befintliga
`/api/public/intag`. Den sammansatta beskrivningen kortas innan den skickas,
med kundens egna ord prioriterade före guidens metadata.

Visuellt konsoliderades fem olika kortutseenden till ett. Färg reserverades
för säkerhetsläge och eskalering. Panelen leds av Nova IT-märket i stället
för en prick som kunde läsas som en online-status.

## Varför?

Guidens dialog fanns bara i webbläsarens `sessionStorage` och försvann när
fliken stängdes, så det kunden faktiskt svarade nådde aldrig ärendet. Den
smala nyckelordslistan gjorde samtidigt att naturligt formulerade
beskrivningar ofta hamnade i "Annat problem" i stället för rätt område.

Adminportalen avvisar hela ärendet när beskrivningen överskrider 2000 tecken.
Kundens fritext var redan tillåten upp till 2000, så när guidens kontext lades
ovanpå kunde ett korrekt ifyllt ärende misslyckas i sista steget.

Guidens råd och checklistor utelämnas medvetet ur transkriptet. De är skrivna
för kunden, inte för teknikern som ska läsa ärendet.

## Resultat

Guiden träffar rätt område på fler naturligt formulerade beskrivningar, och
personalen ser hela den guidade dialogen i ärendet i stället för en
enradsrubrik. Ett ärende kan inte längre avvisas på grund av att guidens
kontext gjorde beskrivningen för lång.

## Dokumentationspåverkan

Ingen. Supportassistenten är fortfarande regelbaserad och anropar ingen extern
AI-tjänst, vilket är den avgränsning som redan står i
`docs/supportbot-integration-report.md`.
