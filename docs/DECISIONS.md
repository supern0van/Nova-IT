# Nova IT – beslutslogg

Beslutsloggen förklarar större vägval. Den kompletterar changelogen: changelogen visar vad som förändrades, medan denna fil visar varför en riktning valdes framför andra alternativ.

## DEC-0006 – Kundportalens grundarkitektur (separat repo, Worker, databas)

**Status:** accepterat
**Datum:** 2026-07-29

### Bakgrund

Kundportalen (kundinloggning, ärendevy, kundkommunikation) skulle byggas efter att
adminportalen och det publika ärendeintaget redan var i skarp drift. Se
`docs/kundportal-planering.md` för fullständigt resonemang - denna post
sammanfattar bara de beslut som planeringen identifierade som blockerande innan
kodning kunde börja (B1–B3), samt vilket val som gjordes.

### Beslut

- **B1 (Supabase-projekt):** separat Supabase-projekt (`nova-it-kundportal`,
  projekt-id `bueysepdmxsucmagijvo`, region `eu-west-1`), inte delat med
  adminportalens projekt. Skapat i samma Supabase-organisation ("Nova-IT") som
  redan äger adminportalens projekt - inget nytt Supabase-konto skapades.
  Kostnad: 0 kr/månad, bekräftat innan projektet skapades.
- **Repo:** ny, separat GitHub-repo `supern0van/Nova-IT-Kundportal` (privat,
  eftersom kundportalen kommer hantera kunddata och engångslösenord), inte en
  mapp i huvudrepot. Matchar `docs/roadmap.md`s tidigare formulering ("egen
  repo, Worker och databas").
- **Worker:** ny, separat Cloudflare Worker `nova-it-kundportal`, egen domän
  `kundportal.nova-it.se` (medvetet inte `portal.nova-it.se`/`portal.novait.se`,
  som fortsatt pekar mot `nova-it-admin` tills lansering, se Milstolpe 6 i
  planeringsdokumentet).
- **B2 (autentisering) och B3 (glömt-lösenord-flöde i M2):** ännu INTE
  slutgiltigt beslutade av ägaren - min rekommendation (lösenord med tvingat
  byte vid första inloggning, samt ett glömt-lösenord-flöde redan i M2) gäller
  som arbetshypotes tills vidare, se öppna frågor i
  `docs/kundportal-planering.md`. Uppdatera denna post när de är bekräftade.

### Konsekvens

Adminportalens kod och databas påverkas inte av kundportalsarbetet - de är helt
separata system som endast kommunicerar via skyddade server-till-server-API:er
(samma mönster som redan finns för `INTAG_SECRET`). En bugg eller
säkerhetsincident i kundportalen kan inte direkt exponera adminportalens data.

## DEC-0005 – Handskriven historik ska inte ersättas av automatisk text

**Status:** accepterat  
**Datum:** 2026-07-23

### Bakgrund

Git-commits kan automatiskt samlas in, men de innehåller sällan hela sammanhanget bakom domänköp, hostingbyten, designval och verksamhetsbeslut.

### Beslut

Automationen får validera dokumentationen och samla changelog-fragment, men den får inte skriva över `docs/CHANGELOG.md`, `docs/project-history.md` eller `docs/DECISIONS.md`.

### Konsekvens

Större uppdateringar kräver ett kort mänskligt fragment. Det minskar risken för snygg men felaktig historik.

---

## DEC-0004 – Changelog-fragment används för framtida uppdateringar

**Status:** accepterat  
**Datum:** 2026-07-23

### Bakgrund

Att komma ihåg att redigera en lång changelog efter varje ändring skapar hög friktion och glöms lätt bort.

### Beslut

Varje någorlunda betydande PR ska innehålla en liten Markdown-fil i `docs/changes/`. Filen beskriver vad, varför, resultat och dokumentationspåverkan.

### Konsekvens

GitHub Actions kan kontrollera att större kodändringar har ett fragment. Fragmenten kan senare sammanställas till en releasepost utan att den historiska texten förstörs.

---

## DEC-0003 – GitHub är teknisk sanningskälla

**Status:** accepterat  
**Datumprecision:** 2026-07

### Bakgrund

Projektet fanns i Lovable, exporter och lokala kopior. Flera parallella versioner skulle göra det oklart vilken som var aktuell.

### Beslut

GitHub-repot är den fortsatta sanningskällan för kod och dokumentation. Arkiv används endast som backup eller historisk referens.

### Konsekvens

Ändringar ska göras i branch, verifieras och föras in i `main`. Lovable får inte skapa en parallell osynkroniserad huvudversion.

---

## DEC-0002 – Cloudflare Workers används för publik drift

**Status:** accepterat  
**Datumprecision:** 2026-07

### Bakgrund

Lovable var användbart för att skapa och redigera den första webbplatsen, men den publika driften behövde vara tydligt separerad från editorn.

### Beslut

Webbplatsen byggs från GitHub-koden och publiceras till Cloudflare Workers. Cloudflare hanterar canonical domain, HTTPS och omdirigeringar.

### Konsekvens

En deploy kan publicera fler ändringar än den senast diskuterade filen. Produktionsdeploy ska därför alltid föregås av granskning av hela skillnaden mellan liveversion och `main`.

---

## DEC-0001 – `nova-it.se` är canonical domain

**Status:** accepterat  
**Datumprecision:** 2026-07

### Beslut

`nova-it.se` används som synlig huvudadress. `www.nova-it.se`, `novait.se` och `www.novait.se` omdirigeras permanent till huvuddomänen.

### Konsekvens

SEO, länkar, verifieringsfiler och extern kommunikation ska i första hand använda `nova-it.se`.