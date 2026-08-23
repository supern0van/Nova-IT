# Mejlkonton i adminportalen — planeringsunderlag

Påbörjat: 2026-08-23. Beslutat av Stefan: adminportalen (Worker
`nova-it-admin`, Next.js på Cloudflare via OpenNext, mapp `adminportal/` i
monorepot `supern0van/nova-it-portaler` - se
`docs/admin-portal-release-readiness.md`) ska kunna läsa och besvara Nova
IT:s Loopia-mejlkonton direkt, i stället för att kräva en separat
webmail-inloggning. Det här dokumentet skrevs ursprungligen i publika repot
eftersom portalrepot inte var anslutet i sessionen än - `nova-it-portaler`
är nu anslutet (läsåtkomst) och bör vara den plats där själva spiken/koden
till slut hamnar; det här dokumentet flyttas eller dupliceras dit när
kodningen faktiskt påbörjas.

## Vad ska lösas

Fem aktiva mejlkonton hos Loopia: `kontakt@`, `support@`, `info@`,
`webmaster@`, `no-reply@nova-it.se` (se `docs/project-status.md` och
`docs/email-dns-handoff.md`). I dag nås de bara via Loopias egen webmail
eller en extern mejlklient. Målet är en vy i adminportalen där inkorgen för
(i första hand) `kontakt@` går att läsa, sortera och besvara utan att lämna
dashboarden.

## Vad Loopia faktiskt erbjuder

Loopia har **ingen dedikerad mejl-REST-API** för att läsa/skicka post -
åtkomsten är standard **IMAP/SMTP**:

- IMAP: `mailcluster.loopia.se`, port 993 (SSL/TLS) eller 143 (STARTTLS).
- SMTP: samma mönster, autentisering med fullständig e-postadress som
  användarnamn.
- Webmailen själv använder samma IMAP-koppling - det finns alltså inget
  "genare" API att gå via, bara protokollet.

Källa: [Loopia Knowledge Base - Email servers](https://support.loopia.com/wiki/email-servers/),
[Email clients](https://support.loopia.com/wiki/email-clients/).

## Den tekniska knäckfrågan: IMAP från en Cloudflare Worker

Adminportalen körs på Cloudflare Workers (via OpenNext). IMAP/SMTP är inte
HTTP - de kräver en rå TCP-socket med TLS. Cloudflare Workers stödjer detta
via `connect()` från `cloudflare:sockets` (Cloudflare marknadsför uttryckligen
detta för att bygga mejlklienter i Workers), men det är ett annat
programmeringsmönster än vanliga `fetch`-anrop och kräver ett
IMAP/SMTP-bibliotek som kan köra ovanpå en rå socket i stället för Node:s
`net`-modul (som inte finns i Workers runtime). Detta måste verifieras i en
teknisk spik innan resten av funktionen byggs - det är den enda punkt i hela
idén som skulle kunna göra ansatsen opraktisk och tvinga fram ett
alternativ.

**Uppdatering 2026-08-23 - de-riskat något:** `nova-it-portaler`-repot
(adminportalen låg tidigare i ett eget `nova-it-admin`-repo, nu i
monorepot `supern0van/nova-it-portaler`, mapp `adminportal/`) har redan
`nodejs_compat` som compatibility flag i `adminportal/wrangler.jsonc`. Det
gör spiken enklare än väntat: `nodejs_compat` ger delvis stöd för Node:s
`net`/`tls`-moduler ovanpå `cloudflare:sockets`, vilket är precis det många
npm-paket för IMAP förutsätter. Spiken kan alltså troligen börja med att
testa ett vanligt IMAP-bibliotek direkt, i stället för att skriva en
egen IMAP-klient ovanpå råa sockets - fallback till rå
`cloudflare:sockets` finns kvar om biblioteket inte fungerar.

**Om spiken inte fungerar**, näst bästa alternativ i prioritetsordning:
1. En liten fristående Worker (annan runtime-konfiguration) som enbart
   sköter IMAP/SMTP och exponerar ett internt HTTP-API för adminportalen -
   samma mönster som redan används för kundportal/adminportal-kommunikation
   (server-till-server över interna endpoints, se
   `docs/juridisk-granskning-underlag.md` avsnitt 1).
2. En tredjeparts "email-to-API"-tjänst (t.ex. en hanterad IMAP-till-webhook-
   lösning) - inför då ett nytt personuppgiftsbiträde och en ny
   leverantörsbedömning, vilket bör undvikas om det går att lösa internt.

## Föreslagen första avgränsning (MVP)

- Bara `kontakt@nova-it.se` inledningsvis - det är den faktiska publika
  kontaktadressen och där volymen faktiskt finns.
- Läs + skicka svar. Ingen mappstruktur/regelmotor/automatisk sortering i
  första versionen.
- Ingen koppling till kundportalens ärendedata i MVP:t - ren mejlvy. Koppling
  mellan ett inkommet mejl och ett existerande kundärende är en naturlig
  version 2, inte en förutsättning för version 1.
- Autentiseringsuppgifterna (mejlkontots lösenord) lagras som Cloudflare
  Worker-secrets, aldrig i kod eller databas i klartext - samma princip som
  redan gäller för övriga hemligheter i portalerna.

## Säkerhets- och integritetsfrågor att lösa innan kodning

- Mejlinnehåll är personuppgifter (avsändarens namn, e-post, fritext) - ska
  in i `docs/register-over-behandlingar.md` och
  `docs/juridisk-granskning-underlag.md` som en ny behandling.
- Vem i adminportalen ska ha åtkomst till mejlvyn - alla admin-användare
  eller en separat behörighetsnivå?
- Rate limiting/felhantering om IMAP-servern är nere eller svarar långsamt -
  ska inte kunna hänga eller krascha resten av dashboarden.

## Nästa steg

1. Teknisk spik i `nova-it-portaler` (`adminportal/`): bekräfta att en
   IMAP-koppling faktiskt går att göra från Workern, i första hand via ett
   vanligt npm IMAP-bibliotek ovanpå `nodejs_compat`, annars rå
   `cloudflare:sockets`. Kräver push-åtkomst till repot (denna session har i
   dagsläget bara läsåtkomst) och ett testmejlkonto - `kontakt@nova-it.se`
   eller ett dedikerat testkonto hos Loopia, inte ett skarpt konto under
   spikens första försök.
2. Om spiken lyckas: bygg MVP:t ovan för `kontakt@` i ett eget planerings-/
   arbetsordningsdokument i `nova-it-portaler`, i samma stil som
   `docs/kundportal-arbetsorder.md`.
3. Om spiken misslyckas: utvärdera fallback-alternativen ovan.
