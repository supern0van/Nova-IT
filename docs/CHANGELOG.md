# Nova IT – changelog

Den här changelogen dokumenterar större förändringar i projektet. Den är medvetet mer förklarande än en traditionell versionslista.

## Regler

- Varje större post får ett permanent ID: `NOVA-xxxx`.
- Exakta datum används endast när de kan verifieras.
- `Datumprecision: månad` betyder att månaden är känd men inte den exakta dagen.
- Små kodjusteringar kan samlas i en post; viktiga vägval får en egen post.
- Historiska luckor markeras öppet och fylls inte med antaganden.

---

## NOVA-0010 – Google Search Console-verifiering förbereddes

```yaml
datum: 2026-07
datumprecision: månad
typ: seo
status: förberedd, ej verifierad i produktion
system: [GitHub, Google Search Console, Cloudflare]
```

Verifieringsfilen `public/google6f37f95265dbf94a.html` lades till i Git-repot för att göra det möjligt att verifiera ägarskapet av `nova-it.se` i Google Search Console.

Ändringen publicerades inte automatiskt. Eftersom GitHub-versionen låg före den dåvarande publika webbplatsen skulle en produktiondeploy även publicera övriga väntande ändringar. Deployen sköts därför upp tills hela den nyare versionen kunde granskas och publiceras som en sammanhållen release.

**Resultat:** verifieringsunderlaget finns i källkoden, men produktionsstatus måste kontrolleras separat.

---

## NOVA-0009 – GitHub blev projektets tekniska sanningskälla

```yaml
datum: 2026-07
datumprecision: månad
typ: arbetsflöde
status: genomförd
system: [GitHub, Lovable]
```

Projektet hade före GitHub-arbetet förekommit i flera former, bland annat Lovable-projekt och exporterade arkiv. För att undvika att olika zip-filer, lokala kopior och editorversioner utvecklades åt olika håll valdes Git-repot som den enda fortsatta källan för kod och dokumentation.

Lovable behölls som ursprunglig editor- och Git-integration, men repot fick rollen som spårbar och versionshanterad grund.

**Resultat:** fortsatt utveckling kan följas, granskas och återställas genom Git-historiken.

---

## NOVA-0008 – Publik drift etablerades på Cloudflare Workers

```yaml
datum: 2026-07
datumprecision: månad
typ: infrastruktur
status: genomförd
system: [Cloudflare Workers, DNS, HTTPS]
```

Cloudflare Workers valdes som publik driftmiljö för webbplatsen. Det separerade den publika hostingen från Lovable och gjorde GitHub-koden till underlag för verifierad build och deploy.

`nova-it.se` blev huvudadress. `www.nova-it.se`, `novait.se` och `www.novait.se` konfigurerades för permanent omdirigering till huvuddomänen. Cloudflare tog även ansvar för HTTPS.

**Resultat:** Nova IT fick en tydlig canonical domain och en driftmiljö som kan byggas och publiceras från repot.

---

## NOVA-0007 – Webbplatsens design och informationsstruktur omarbetades

```yaml
datum: 2026-07
datumprecision: månad
typ: design
typ_2: innehåll
status: genomförd i källkod
system: [React, TanStack Start, Tailwind CSS]
```

Den tidigare Lovable-versionen vidareutvecklades till en mer sammanhållen webbplats med tydligare startsida, tjänster, arbetssätt, FAQ, information om Nova IT och kontaktflöde.

Den visuella riktningen ändrades mot en nästan svart bas, vit typografi och klar blå accent. Målet var att få en saklig och professionell tjänstesida snarare än ett generiskt AI-genererat uttryck.

**Resultat:** webbplatsen fick ett mer konsekvent designsystem och en tydligare väg från behov till kontakt.

---

## NOVA-0006 – Supportassistenten ändrades till ett praktiskt ärendeflöde

```yaml
datum: 2026-07
datumprecision: månad
typ: funktion
status: genomförd i källkod
system: [React, lokal regelmotor, kontaktflöde]
```

En tidigare mer framträdande robotdesign ersattes av en diskret supportassistent. Fokus flyttades från visuell gimmick till att hjälpa besökaren beskriva problemet, välja ärendetyp och gå vidare till kontakt.

Assistenten använder en lokal regelbaserad kunskapsmotor och skickar inte kunddata till en extern AI-tjänst. Vid behov eskaleras användaren till kontaktformuläret.

**Resultat:** funktionen blev mer förutsägbar, integritetsvänlig och användbar för faktisk kundmottagning.

---

## NOVA-0005 – Lovable-exporten anslöts till GitHub

```yaml
datum: 2026-07
datumprecision: månad
typ: versionshantering
status: genomförd
system: [Lovable, GitHub, Git]
verifiering: första verifierade commit 3340de84f4304c3e1679d65e97b1cd60a623ccf4
```

Den första verifierbara Git-händelsen är committen `before: initial Lovable export`. Den visar att en TanStack Start-baserad Lovable-export lades in som projektets tekniska utgångspunkt.

Detta är inte nödvändigtvis dagen då idén eller den första webbplatsen skapades. Det är startpunkten för den historik som säkert kan verifieras i repot.

**Resultat:** projektet fick spårbar versionshistorik och kunde vidareutvecklas utanför den ursprungliga editorn.

---

## NOVA-0004 – Lovable användes för att skapa den första fungerande webbplatsen

```yaml
datum: 2026
datumprecision: år
typ: webbplats
status: historiskt verifierad, exakt datum saknas
system: [Lovable]
```

Lovable användes för att gå från företagsidé och tjänstebeskrivningar till en konkret, redigerbar webbplats. Den första versionen fungerade som prototyp och teknisk grund, inte som slutlig design.

Senare arbete ändrade bland annat språk, tjänstesidor, navigation, kontaktflöde, supportassistent och visuell riktning.

**Resultat:** Nova IT fick sin första fungerande webbnärvaro och en kodbas som senare kunde flyttas till GitHub.

---

## NOVA-0003 – Ytterligare domän säkrades

```yaml
datum: 2026
datumprecision: år
typ: domän
status: genomförd, exakt ordning kräver verifiering
system: [domänregistrar, DNS]
```

Utöver huvuddomänen säkrades en närliggande domänvariant. Syftet var att skydda namnet, fånga vanliga skrivsätt och kunna styra besökare till en enda canonical domain.

Den senare Cloudflare-konfigurationen använder `nova-it.se` som huvuddomän och omdirigerar `novait.se` samt www-varianterna dit.

**Resultat:** varumärket fick bättre domäntäckning och besökare kan ledas till samma publika adress.

---

## NOVA-0002 – Domän och första hostinglösning beställdes

```yaml
datum: 2026
datumprecision: år
typ: infrastruktur
status: genomförd, datum och leverantörsordning behöver verifieras
system: [Strato, domän, webbhotell]
```

Nova IT behövde en egen permanent adress som inte var bunden till en tillfällig projektsida. Domän och webbhotell beställdes därför i ett tidigt skede. Strato ingick i den första lösningen innan projektet senare flyttade sin publika webbdrift till Cloudflare.

Köpet var mer än en administrativ händelse: det gjorde det möjligt att planera företagets webbplats, framtida e-post och en stabil offentlig identitet.

**Resultat:** projektet fick en egen domän och en första teknisk bas för publicering.

---

## NOVA-0001 – Idén och inriktningen för Nova IT formulerades

```yaml
datum: 2026
datumprecision: år
typ: projektstart
status: genomförd, exakt datum saknas
system: [verksamhetsidé]
```

Nova IT formulerades som en lokal IT-verksamhet för privatpersoner, mindre företag och föreningar. Den tidiga inriktningen omfattade praktisk IT-hjälp, support, uppgraderingar, nätverk och renoverade datorer.

Webbplatsen skulle inte bara vara en presentation utan även hjälpa besökare förstå tjänsterna, beskriva sina problem och ta nästa steg mot kontakt.

**Resultat:** projektets målgrupp, tjänsteinriktning och behov av en egen webbplats etablerades.

---

## Opublicerat

Framtida större ändringar dokumenteras först som changelog-fragment i `docs/changes/`. När en release godkänns sammanställs relevanta fragment här utan att tidigare historik skrivs över.