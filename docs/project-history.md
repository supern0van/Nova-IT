# Projekthistorik

Detta är en kort beslutshistorik för Nova IT. Den ersätter inte Git-historiken, utan gör den läsbar utan att man behöver följa varje enskild commit eller chat.

## 2026-07: Grund och riktning

- En tidigare Lovable/TanStack Start-export blev projektets utgångspunkt. Den ursprungliga historiken bevaras, medan den publika sidan drivs separat på Cloudflare.
- Flera arkiv och tidigare genererade filer granskades. Git-repot valdes som enda källan för fortsatt arbete; zip-filer är bara backup eller referens.
- Figma V3 valdes som visuell riktning: nästan svart bas, vit typografi, klar blå accent och en redaktionell, saklig servicestruktur.

## 2026-07: Webbplats och assistent

- Startsidan, tjänster, arbetsflöde, FAQ och kontakt fick en skarpare och mer sammanhållen form.
- Den tidigare stora, gröna robotdesignen ersattes av en diskret, mörk supportassistent med tydligare fokus på ärendesortering och kontakt.
- Kontaktflödet och tjänstelänkar behöll fungerande serviceförval i stället för att ersättas av Figma-prototypens enklare formulärexempel.

## 2026-07: Drift och domäner

- Cloudflare Workers valdes för publik drift.
- `nova-it.se` är huvuddomänen och den synliga adressen för Nova IT.
- `www.nova-it.se`, `novait.se` och `www.novait.se` omdirigerar permanent till huvuddomänen så att kunden alltid landar på samma webbplats.
- Cloudflare hanterar HTTPS; gamla webbpekningar från tidigare hosting togs bort utan att e-postens DNS-poster rördes.

## 2026-07: Kodägande och struktur

- Lovable behålls som tydligt avgränsad ursprungs- och editorintegration, inte som publik hosting eller synligt beroende på sidan.
- README och dokumentation gör nu projektets aktuella läge, drift och beslut enklare att följa direkt i GitHub.
- Produktionsprincipen är att `main` motsvarar den godkända publika webbplatsen; arbetsbrancher får endast användas för lokala eller separata Cloudflare-förhandsvisningar.

## 2026-07: E-post och framtida portal

- `kontakt@nova-it.se`, `support@nova-it.se` och `info@nova-it.se` är förberedda i webbplatsens kontaktkonfiguration, men visas inte publikt ännu.
- E-postens DNS flyttas inte förrän Loopias exakta poster har förts in i Cloudflare och verifierats.
- `portal.nova-it.se` är reserverad för en framtida kund- och adminportal. Den ska ha egen Worker, databas, hemligheter och releasecykel.

## Nästa beslut

- Formulera det slutliga kundbudskapet, tjänsterna och kontaktinformationen.
- Håll produktionsgrenen och Cloudflare-deployen synkade vid varje godkänd release.
- Bestäm om kontakt- och assistentflöden ska få backend eller ärendesystem.
