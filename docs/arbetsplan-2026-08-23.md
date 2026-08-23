# Arbetsplan — Claudes egen plan för nästa fas (2026-08-23)

Det här är min egen arbetsplan för hur jag hjälper Stefan vidare med de tre
öppna spåren, i den ordning jag tänker driva dem. Statusen uppdateras här
efter hand i stället för att spridas ut över flera commits.

## Spår 1: Fler tjänster + priser

**Status: mitt förslag klart, väntar på Stefans val.**

- [x] Kandidatlista (`docs/tjanster-kandidater-arbetsdokument.md`).
- [x] Rangordnat förslag på startordning i samma dokument.
- [x] Prisförslag för de fyra högst rankade kandidaterna
      (`docs/priser-arbetsdokument.md`).
- [ ] Stefan väljer/stryker bland kandidaterna och godkänner eller justerar
      prisförslagen.
- [ ] När godkänt: jag lägger in de valda tjänsterna i `src/lib/nova-data.ts`
      **men håller dem opublicerade** - inte förrän go-live-beslutet (se
      `docs/priser-arbetsdokument.md`, "Publiceringsvillkor"). Tekniskt löses
      det troligen med samma mönster som `SUPPORT_ASSISTANT_IS_ONLINE`: en
      huvudbrytare som döljer de nya tjänsterna tills den slås på, i stället
      för att hålla dem utanför `main` helt - lättare att granska och testa
      i god tid innan lansering.

## Spår 2: Google Business-profil

**Status: checklista klar, väntar på att Stefan faktiskt skapar profilen.**

- [x] Checklista (`docs/google-business-profil-checklista.md`) med
      NAP-konsistens, service-area-kategori (för att undvika att exponera
      hemadressen), och en öppen fråga om telefonnumret ska bli publikt för
      att profilen ska fungera fullt ut.
- [ ] Stefan skapar profilen, väntar ut Googles vykorts-verifiering.
- [ ] När verifierad: jag lägger in `sameAs`-länken i
      `buildLocalBusinessJsonLd()` (`src/lib/structured-data.ts`) - litet,
      snabbt jobb när jag har URL:en.

## Spår 3: Mejlkonton i adminportalen (admin-mail-spiken)

**Status: repo anslutet (läsläge), spik inte påbörjad - kräver push-åtkomst.**

- [x] Hittade rätt repo: `supern0van/nova-it-portaler` (monorepo,
      adminportalen låg tidigare i ett separat `nova-it-admin`-repo som inte
      längre är den aktuella platsen). Anslutet med läsåtkomst och klonat.
- [x] Bekräftat i `adminportal/wrangler.jsonc`: `nodejs_compat` är redan på
      som compatibility flag - de-riskar spiken, ett vanligt npm
      IMAP-bibliotek kan troligen användas direkt i stället för att skriva
      en egen klient ovanpå råa `cloudflare:sockets`.
- [x] Planeringsdokument uppdaterat med detta
      (`docs/admin-mail-integration-planering.md`).
- [ ] **Nästa konkreta steg, kräver Stefans go-ahead:** be om push-åtkomst
      till `nova-it-portaler` (nuvarande session har bara läsåtkomst) och ett
      testmejlkonto hos Loopia - inte ett skarpt konto - så jag kan köra
      själva spiken: ett minimalt skript som kopplar upp mot
      `mailcluster.loopia.se:993` och listar innehållet i en inkorg, körande
      i adminportalens faktiska Worker-miljö (inte bara lokalt), för att
      verifiera att `nodejs_compat` faktiskt räcker i praktiken och inte bara
      i teorin.
- [ ] Om spiken lyckas: skriv MVP-arbetsordning i `nova-it-portaler` (samma
      stil som `docs/kundportal-arbetsorder.md`) och börja bygga
      `kontakt@`-vyn.
- [ ] Om spiken misslyckas: falla tillbaka på alternativen redan listade i
      planeringsdokumentet (egen liten IMAP-Worker, eller en hanterad
      tredjepartstjänst som sista utväg).

## Vad jag väntar på från Stefan

1. Val bland tjänstekandidaterna (spår 1) - eller "kör på med din
   rangordning" om det räcker.
2. Beslut om Google Business-profilen ska skapas nu, och om telefonnumret
   ska bli publikt i samband med det (spår 2).
3. Push-åtkomst till `nova-it-portaler` + ett testmejlkonto hos Loopia, för
   att faktiskt kunna köra spiken i spår 3 - annars stannar det vid
   planering.

## Vad jag inte väntar på - gör löpande utan att fråga igen

- Håll det här dokumentet uppdaterat när något av ovanstående blir klart,
  i stället för att skapa nya planeringsdokument för varje litet steg.
- Kör alltid `bun run ci` innan push i `nova-it`-repot, och motsvarande
  `pnpm ci`/`pnpm test`/etc. i `nova-it-portaler` när jag väl kodar där.
