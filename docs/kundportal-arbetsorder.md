# Arbetsorder: Kundportal, Milstolpe 0

Senast uppdaterad: 2026-07-29
Föregås av: `docs/kundportal-planering.md` (läs den först - det här är utförandeordern
för planens Milstolpe 0, inte en ersättning för planen)

## Syfte

Den här arbetsordern startar det faktiska arbetet med kundportalen. Den täcker
**endast Milstolpe 0** (beslut + grundstruktur) - inte hela bygget. En ny
arbetsorder skrivs för varje milstolpe när den föregående är klarmarkerad.

## Förutsättning som måste kontrolleras INNAN arbetet startar

1. Kontrollera att `main` i huvudrepot (`Nova-IT`) är grönt: `git log --oneline -3`,
   `gh api repos/supern0van/Nova-IT/commits/HEAD/check-runs`. Om något är rött:
   stanna och rapportera, börja inte kundportalsarbetet på en instabil grund.
2. Kontrollera att ingen annan session/process just då gör auth-relaterade
   ändringar i `portal/` (se planeringsdokumentets avsnitt 7). Om osäker: fråga
   ägaren.

## Beslut som krävs av ägaren innan kodning (blockerar M0 → M1)

Presentera dessa tre val för ägaren. Om inget annat sägs, är **rekommendationen
default** och arbetet fortsätter med den efter en rimlig svarstid - men de ska
alltid ställas, aldrig antas tyst.

| # | Fråga | Rekommendation | Alternativ |
|---|---|---|---|
| B1 | Separat Supabase-projekt för kundportalen, eller delat med adminportalen? | Separat projekt | Delat projekt, eget schema |
| B2 | Engångslösenord med tvingat byte, eller passwordless magic link? | Lösenord + tvingat byte (matchar ursprunglig efterfrågan) | Magic link (enklare, säkrare, inget lösenord att läcka) |
| B3 | Ska kunden redan i M2 kunna begära ett nytt engångslösenord om välkomstmejlet uteblir? | Ja, bygg in det direkt i M2 | Skjut till en senare milstolpe |

Dokumentera svaren som en ny post i `docs/DECISIONS.md` (nästa lediga DEC-nummer)
innan M1 påbörjas.

## Konkreta uppgifter i Milstolpe 0

1. **Skapa kundportalens grundstruktur.**
   - Om B1 = separat projekt: nytt Supabase-projekt, ny Cloudflare Worker
     (t.ex. `nova-it-kundportal`), ny mapp/repo för koden.
   - Om B1 = delat projekt: nytt schema i befintligt Supabase-projekt, fortfarande
     egen Cloudflare Worker (redan beslutat oavsett B1, se planens avsnitt 1).
   - Grundläggande CI: spegla `documentation-guard.yml` och `ci.yml`-mönstret från
     huvudrepot (test/lint/typecheck/build som måste vara gröna).
2. **Deploya ett minimalt "Hello world"-skydd** på den tilltänkta domänen, så att
   Worker, DNS och byggkedjan är bevisat fungerande innan något riktigt innehåll
   byggs.
3. **Skriv DEC-posten** i `docs/DECISIONS.md` med de bekräftade svaren på B1-B3.
4. **Uppdatera `docs/roadmap.md`**: flytta kundportalen från "Senare beslut som
   kräver ägarinput" till en ny, aktiv sektion i linje med hur resten av filen är
   strukturerad.

## Definition of Done för Milstolpe 0

- [ ] B1, B2, B3 beslutade och skrivna som DEC-post.
- [ ] Ny Worker/domän deployad med minimalt innehåll, nåbar över HTTPS.
- [ ] CI grönt för den nya kodbasen (test/lint/typecheck/build).
- [ ] `docs/roadmap.md` uppdaterad.
- [ ] Inget av det befintliga (publik sajt, adminportal) har påverkats eller
      gått sönder under arbetet - kontrollera med samma CI-koll som i
      förutsättningen ovan, efteråt också.

Först när samtliga punkter är avbockade skrivs nästa arbetsorder, för Milstolpe 1.
