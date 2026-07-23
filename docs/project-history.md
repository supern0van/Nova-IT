# Projekthistorik

Detta dokument berättar hur Nova IT växte från verksamhetsidé till fungerande webbplats och teknisk plattform. Det ersätter inte Git-historiken. Syftet är att förklara sammanhanget: vad som gjordes, varför riktningen ändrades och vad varje steg möjliggjorde.

Exakta datum används bara där de är verifierade. De tidigaste stegen är kända som händelser men behöver kompletteras med ordermejl, domänhistorik eller äldre konversationer för exakt datering.

## Epok 1 – Idén blir ett projekt

Nova IT formulerades som en lokal IT-verksamhet med praktisk hjälp för privatpersoner, mindre företag och föreningar. Inriktningen omfattade bland annat support, uppgraderingar, nätverk, installationer, säkerhet och renoverade datorer.

Redan från början fanns behovet av mer än en enkel presentationssida. Webbplatsen skulle hjälpa besökaren förstå tjänsterna, beskriva sitt problem och ta nästa steg mot kontakt. Därmed blev webbplatsen både ett marknadsföringsprojekt och ett framtida verktyg för kundmottagning.

## Epok 2 – Domän och första hosting

En egen domän och en första webbhotellslösning beställdes. Strato ingick i den tidiga infrastrukturen. Detta gav Nova IT en permanent identitet som inte var bunden till en tillfällig projektsida eller en webbplatsbyggares underdomän.

En närliggande domänvariant säkrades också. Det gjorde det senare möjligt att använda `nova-it.se` som huvudadress och styra vanliga varianter till samma webbplats.

De exakta köpdatumen och ordningen mellan domän- och hostingbeställningarna är ännu inte verifierade i repot. De bör senare kontrolleras mot ordermejl och registrarhistorik.

## Epok 3 – Den första webbplatsen i Lovable

Lovable användes för att omvandla företagets idé, tjänster och visuella önskemål till en fungerande webbplats. Den versionen blev en viktig prototyp och teknisk startpunkt, men inte den slutliga lösningen.

Under arbetet utvecklades kraven. Navigation, tjänstesidor, formulär, texter, supportassistent och mobilupplevelse behövde bli tydligare. Projektet gick därför från att främst vara en AI-genererad webbplats till att bli en egen kodbas som kunde granskas och vidareutvecklas systematiskt.

## Epok 4 – GitHub ansluts

Den första verifierbara Git-händelsen är committen `3340de84f4304c3e1679d65e97b1cd60a623ccf4` med meddelandet `before: initial Lovable export`. Den markerar början på den säkert spårbara repohistoriken, inte nödvändigtvis projektets faktiska födelsedag.

Lovable-exporten byggde på TanStack Start, React, TypeScript och Tailwind CSS. Genom GitHub kunde projektet börja använda brancher, commits, tester, CI och återställningsbar historik.

Flera exporter och arkiv förekom under projektets utveckling. Git-repot valdes därför som enda fortsatt sanningskälla. Zip-filer och äldre exporter ska betraktas som backup eller historisk referens, inte som parallella huvudversioner.

## Epok 5 – Webbplatsen får en tydligare identitet

Webbplatsens visuella och redaktionella riktning arbetades om. En nästan svart bas, vit typografi och klar blå accent valdes för att skapa ett mer professionellt och sammanhållet uttryck.

Startsida, tjänster, arbetssätt, FAQ, om-sida och kontaktflöde utvecklades till en tydligare helhet. Fungerande tjänsteval behölls genom kontaktflödet i stället för att ersättas med enklare prototypfunktioner.

Supportassistenten förändrades också. En tidigare mer framträdande robotdesign ersattes av en diskret, mörk assistent med fokus på ärendesortering, följdfrågor och trygg övergång till kontakt. Den nuvarande lösningen använder en lokal regelbaserad kunskapsmotor och skickar inte data till en extern AI-tjänst.

## Epok 6 – Cloudflare blir driftmiljö

Cloudflare Workers valdes för den publika webbplatsen. Därmed separerades Lovable som ursprunglig editorintegration från den faktiska produktionsdriften.

`nova-it.se` etablerades som canonical domain. `www.nova-it.se`, `novait.se` och `www.novait.se` konfigurerades för permanent omdirigering till huvuddomänen. Cloudflare hanterar HTTPS och den publika Workern heter `supern0van-nova-it`.

Äldre webbpekningar från tidigare hosting togs bort utan att e-postens DNS-poster flyttades oförsiktigt. E-postflytten hålls separat tills Loopias exakta MX-, SPF-, DKIM- och DMARC-poster har verifierats.

## Epok 7 – Kvalitet, drift och framtida portal

Projektet fick tester, typkontroll, lint och produktionsbuild samlade i `bun run ci`. Arbetsprincipen blev att `main` ska motsvara den godkända produktionsversionen, medan arbetsbrancher granskas lokalt eller i Cloudflare-preview.

Kontaktadresserna `kontakt@nova-it.se`, `support@nova-it.se` och `info@nova-it.se` förbereddes i webbplatsens konfiguration men publicerades inte fullt ut. Kontaktflödet öppnar i nuläget ett e-postutkast och har ännu ingen extern backend eller ärendeplattform.

`portal.nova-it.se` reserverades för en framtida kund- och adminportal. Portalen ska hållas tekniskt avskild med egen Worker, databas, hemligheter och releasecykel.

## Epok 8 – Dokumentationen blir en del av arbetsflödet

Den 23 juli 2026 infördes ett sammanhängande dokumentationssystem. Det består av en kontextuell changelog, beslutslogg, permanenta `NOVA-xxxx`-ID:n, changelog-fragment, PR-mall och en GitHub Actions-kontroll.

Lösningen är medvetet halvautomatisk. Automation kontrollerar att betydande förändringar har ett fragment, men skriver inte om den mänskliga historiken. På så sätt fångas framtida uppdateringar utan att bakgrund, orsaker och resultat reduceras till oprecisa commit-rubriker.

## Fortsatt historisk verifiering

Följande uppgifter bör kompletteras när underlagen finns tillgängliga:

- exakt datum för verksamhetsidéns första dokumenterade form,
- orderdatum för huvuddomän, ytterligare domän och första webbhotell,
- datum för den första Lovable-versionen,
- datum för de första publika versionerna före Cloudflare,
- vilka större webbplatsändringar som gjordes före den första Git-committen,
- datum när varje domän- och DNS-flytt faktiskt genomfördes.

Osäkra datum ska förbli märkta som osäkra tills de kan styrkas. En komplett men fabricerad tidslinje är mindre värdefull än en ärlig historik med tydligt markerade luckor.