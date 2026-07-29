# Nova IT – changelog

Den här changelogen dokumenterar större förändringar i projektet. Den är medvetet mer förklarande än en traditionell versionslista.

## Regler

- Varje större post får ett permanent ID: `NOVA-xxxx`.
- Exakta datum används endast när de kan verifieras.
- `Datumprecision: månad` betyder att månaden är känd men inte den exakta dagen.
- Små kodjusteringar kan samlas i en post; viktiga vägval får en egen post.
- Historiska luckor markeras öppet och fylls inte med antaganden.

---

## NOVA-0018 – Kundportalen planerades som ett helt separat system

```yaml
datum: 2026-07-29
datumprecision: dag
typ: arkitektur
typ_2: planering
status: beslut och arbetsorder dokumenterade, implementation ej påbörjad
system: [GitHub, Supabase, Cloudflare Workers]
```

Kundportalen avgränsades från den befintliga adminportalen. Planeringen fastställde ett separat privat GitHub-repo, ett separat Supabase-projekt, en separat Cloudflare Worker och den framtida domänen `kundportal.nova-it.se`.

Arbetet var dokumentation och arkitekturbeslut, inte kundportalkod. De befintliga tillfälliga `portal.*`-domänerna fortsätter att peka mot admin-Workern tills en separat kundportal faktiskt byggs och lanseras.

**Resultat:** admin-Workern förblir fokuserad på intern kund- och ärendehantering. Kundinloggning, kundkonton och kundportalens autentiseringsflöden ska inte byggas in i adminportalen.

---

## NOVA-0017 – Ett isolerat gästdemoläge infördes för adminportalen

```yaml
datum: 2026-07-29
datumprecision: dag
typ: funktion
typ_2: säkerhet
status: genomförd i källkod
system: [Adminportal, autentisering, demo]
```

Adminportalen fick ett separat lösenordsskyddat gästdemoläge med seedad demodata. Demot separerades från riktiga användarsessioner och från produktionens kund- och ärendedata.

Gästvyn anpassades så att den inte försöker utföra skyddade produktionsåtgärder. När en besökare behöver lämna en riktig förfrågan används i stället det publika kontakt- och ärendeintaget.

**Resultat:** gränssnittet kan demonstreras utan att ge gäster åtkomst till verkliga administrativa uppgifter eller blanda demodata med produktionen.

---

## NOVA-0016 – Adminportalens sessions- och åtkomstskydd skärptes

```yaml
datum: 2026-07-29
datumprecision: dag
typ: säkerhet
status: genomförd i källkod och test
system: [Adminportal, Supabase Auth, Cloudflare Workers]
```

Inloggnings- och sessionsflödet härdades i flera steg. Adminportalen fick canonical host-hantering, tidsgränser för inloggning och inaktivitet, bevarande av oskickade utkast vid sessionsavbrott samt en servervaliderad sessionslease för skyddade anrop.

Skyddade API-rutter behåller JSON-svar även när åtkomst nekas, så klienten kan hantera utloggning och behörighetsfel förutsägbart utan att råka få HTML-omdirigeringar. Säkerhetsgränsen fortsätter att kräva korrekt autentisering, MFA/AAL2 och serverkontrollerad behörighet.

**Resultat:** en gammal, inaktiv eller otillräckligt verifierad session ska inte kunna fortsätta använda adminfunktioner, samtidigt som påbörjat arbete skyddas bättre mot onödig dataförlust.

---

## NOVA-0015 – Adminportalens operativa flöden kopplades till riktig databas och sattes i produktion

```yaml
datum: 2026-07-28
datumprecision: dag
typ: funktion
typ_2: infrastruktur
status: genomförd och produktionsverifierad
system: [Adminportal, Supabase, PostgreSQL, Cloudflare Workers]
```

Adminportalens tidigare demo- och lokallagringsbaserade hantering ersattes av riktiga operativa Supabase-tabeller för kunder, ärenden, meddelanden, aktiviteter, bokningar och kundanteckningar. Läsning och skrivning går via skyddade serverrutter med service role, RLS som extra skydd och nekad direkt klientåtkomst.

Kund- och ärendeformulär fick serveranpassad validering, ärendenummer flyttades till en databassekvens och personalhanteringen kopplades till den riktiga profilmodellen. Skrivvägar fick felhantering, dubbelklicksskydd, behörighetskontroller och utökad testtäckning. Lösenordsbyten kontrolleras dessutom mot kända läckta lösenord.

Den samlade releasekontrollen verifierade tester, lint, typkontroll, build, OpenNext-bundle, Worker-konfiguration, live-schema, domäner, skyddade API-svar och AAL2-flödet. Admin-Workern publicerades därefter och bedömdes som `GO` för skarp intern användning.

**Resultat:** adminportalen använder verklig beständig data för intern kund-, ärende-, boknings- och personalhantering och är inte längre beroende av produktionsdemo eller `localStorage` för dessa flöden.

---

## NOVA-0014 – SMS om att ett ärende är klart för upphämtning infördes

```yaml
datum: 2026-07-29
datumprecision: dag
typ: funktion
status: genomförd i källkod och test
system: [Adminportal, Cloudflare Workers, 46elks]
```

Adminportalens ärendedetaljsida fick en bekräftad åtgärd för att skicka SMS till kunden när ett ärende är klart och en produkt kan hämtas. Funktionen använder 46elks REST-API och kräver samma `svara_kund`-behörighet som annan kundkommunikation.

Telefonnummer normaliseras till internationellt svenskt format och utskicket loggas som en SMS-aktivitet i ärendets tidslinje. Saknade 46elks-inställningar eller externa API-fel hanteras utan att interna felmeddelanden läcker till klienten eller resten av portalen slutar fungera.

**Resultat:** ett vanligt manuellt kundmeddelande kan skickas direkt från ärendet, med spårbarhet och testad felhantering.

---

## NOVA-0013 – Publikt ärendeintag, webbplatsförfining och produktionsverifiering genomfördes

```yaml
datum: 2026-07-29
datumprecision: dag
typ: funktion
typ_2: design, seo, tillgänglighet
status: genomförd och produktionsverifierad
system: [Publik webbplats, Adminportal, Cloudflare Workers]
```

Kontaktformuläret och supportassistenten kopplades till ett gemensamt, skyddat server-till-server-intag som skapar riktiga ärenden i adminportalens databas. Idempotens skyddar mot dubbletter och bekräftelsemejlets status lagras separat, så ett misslyckat mejl inte kan misstolkas som att själva ärendet misslyckades.

Kontaktflödet fick honeypot, tidskontroll och Cloudflare Turnstile-stöd. Efter den första implementationen rättades även runtime-hämtning av Turnstile-nyckeln, en reset-loop vid timeout och ett fel där "Ändra uppgifter" tömde formuläret. Bekräftelsevyn gjordes visuellt mer konsekvent genom att en avvikande rutnätsbakgrund togs bort.

Webbplatsens kundresa och innehåll förfinades samtidigt: tjänstekatalogen fick mer direkt väg till kontakt, serviceområdet samordnades, datorservice återställdes i katalogen, metadata och sitemap kompletterades, kontrastproblem rättades och stora bilder konverterades till WebP. Kontaktlänken på startsidan fick en tydlig markering som inte enbart förlitar sig på färg.

Mobil Lighthouse-mätning på skarp produktion gav prestanda 92–93 och 100/100 för tillgänglighet, Best Practices och SEO på både startsidan och kontaktsidan, med CLS 0.

**Resultat:** publika förfrågningar registreras beständigt, kontaktflödet är robustare och webbplatsen har verifierats som snabb, tillgänglig och tekniskt välstrukturerad i produktion.

---

## NOVA-0012 – Adminportalens Worker-verifiering stärktes

```yaml
datum: 2026-07-28
datumprecision: dag
typ: infrastruktur
status: genomförd
system: [Cloudflare Workers, GitHub Actions, Adminportal]
```

Adminportalen verifieras som en separat Cloudflare Worker i både lokal process och GitHub Actions. CI fick ett eget adminportaljobb för `portal/`, bygger den faktiska OpenNext Worker-bundlen och separerar portalens Next/pnpm-kedja från root-projektets Bun/Vite-kedja.

Ett särskilt smoke-test kontrollerar alla kopplade admin- och tillfälliga portaladresser efter deploy, inklusive att skyddade API:er nekar oinloggad trafik. Worker-konfiguration, obligatoriska secrets, route-kontrakt och releasekommandon fick egna tester och kontroller.

**Resultat:** adminportalens build, deployunderlag, domäner och fail-closed-beteende kan verifieras oberoende av den publika webbplatsen.

---

## NOVA-0011 – Förklarande projekthistorik och dokumentationskontroll infördes

```yaml
datum: 2026-07-23
datumprecision: dag
typ: infrastruktur
status: genomförd
system: [GitHub, GitHub Actions, projektdokumentation]
```

Ett sammanhängande dokumentationssystem skapades med dokumentationsnav, kontextuell changelog, beslutslogg, projekthistorik, arbetsflöde, changelog-fragment, PR-mall och automatisk validering i GitHub Actions.

Syftet var att fånga projektets större tekniska och verksamhetsmässiga förändringar utan att varje liten commit skapar administrativt arbete eller att en automatisk sammanställning hittar på historiska samband.

**Resultat:** betydande ändringar ska följas av ett kort fragment, medan den långsiktiga historiken fortfarande sammanställs och granskas mänskligt.

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

Framtida större ändringar dokumenteras först som changelog-fragment i `docs/changes/`. När en release godkänns sammanställs relevanta fragment här utan att tidigare historik skrivs över. Fragment som har sammanställts ska därefter tas bort eller arkiveras enligt `docs/documentation-workflow.md`.
