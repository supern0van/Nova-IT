---
id: NOVA-0028
date: 2026-08-03
date_precision: day
type: changed
status: completed
systems:
  - public-site
---

# Portal-ingång i sidhuvudet

## Vad ändrades?

Knappen "Kundportal" i sidhuvudet heter nu "Portal" och öppnar en panel i stället för att vara en ren länk. Panelen förklarar kort vad kundportalen är och innehåller inloggningsknapp, "Glömt lösenord?" och en diskret markering om säker anslutning. Samma komponent används i både desktopnavigeringen och mobilmenyn (`src/components/portal-meny.tsx`).

Panelen stänger på Escape, på klick utanför, och lämnar tillbaka fokus till knappen när Escape används.

## Varför?

Portalingången var tidigare en ensam länk utan sammanhang. En Figma-prototyp ("Kundinloggning med dropdown", Version 2) föreslog en panel med inloggningsformulär direkt i sidhuvudet. Ett formulär som tar emot lösenord på `nova-it.se` kunde dock inte byggas utan att försvaga tre skydd som medvetet finns på plats:

- Kundportalens login-API kräver samma origin (`verifieraSameOrigin`, tillagd i "Harden customer browser mutations"). Verifierat live: anrop med `Origin: https://nova-it.se` svarar 403.
- Supabases sessionskakor är avsiktligt host-bundna, så en inloggning på `nova-it.se` kan inte sätta en användbar session för `kundportal.nova-it.se` utan att kakorna breddas till hela `.nova-it.se` - vilket skulle läcka sessioner till adminsubdomänen.
- Adminportalen ligger bakom Cloudflare Access, som svarar 302 mot sin identitetsleverantör innan appen nås. Ett publikt formulär kan därför principiellt inte autentisera interna konton.

Panelen ger prototypens upplevelse och sammanhang, medan själva inloggningen sker kvar på rätt origin med alla skydd intakta.

## Resultat

Sidhuvudet har en Portal-ingång som ger sammanhang före inloggning, på både desktop och mobil, utan någon förändring av autentisering, CSP eller andra säkerhetsheaders. Interna roller har fortfarande ingen synlig publik ingång.

## Dokumentationspåverkan

Ingen.
