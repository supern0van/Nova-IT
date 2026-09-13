# Nova IT – beslutslogg

Beslutsloggen förklarar större vägval. Den kompletterar changelogen: changelogen visar vad som förändrades, medan denna fil visar varför en riktning valdes framför andra alternativ.

## DEC-0007 – Fail-open per-IP-hastighetsskydd är ett medvetet val, inte en lucka

**Status:** accepterat
**Datum:** 2026-09-13

### Bakgrund

Den fördjupade revisionen (PUB-1/PUB-3) lade till eget per-IP-hastighetsskydd
för supportchatten (`arChattIpSparrad`, `support-ai-runtime.ts`) och
kontaktformuläret (`arKontaktformularIpSparrad`, `contact-ratelimit.ts`).
Båda faller tillbaka till "släpp igenom" (fail-open) om Cloudflares
`ratelimits`-bindning saknas i miljön, eller om ingen pålitlig IP
(`cf-connecting-ip`/`x-forwarded-for`) går att läsa ur requesten. En
efterföljande bred granskning (2026-09-13) flaggade detta som värt att
motivera explicit, i stället för att bara stå som en kommentar i koden.

### Beslut

Fail-open behålls, oförändrat. Motivering:

- Båda spärrarna är **sekundära/kompletterande** skydd, inte den enda
  linjen. Supportchatten har den delade, fail-closed AI-budgetspärren
  (`harAiBudget`) bakom sig; kontaktformuläret har Turnstile (fail-closed i
  produktion, se `contact-server.ts`) och adminportalens egen nedströms
  IP-spärr (`publik-statuskoll-server.ts`/`hamtaKlientIp`) bakom sig. Ingen
  av dessa två nya spärrar är den sista försvarslinjen mot missbruk - de
  finns för att slå till TIDIGARE, innan en begäran ens når AI-budgeten
  eller adminportalen.
- Att göra dem fail-closed hade betytt: en driftsstörning i Cloudflares
  `ratelimits`-tjänst, eller en request där IP-headern av någon anledning
  saknas (t.ex. ett internt hälsokontrollanrop, en proxy-konfiguration som
  ändras), stänger av HELA kontaktvägen till Nova IT - även för legitima
  besökare. Det är en väsentligt värre konsekvens än att en angripare i
  undantagsfall slipper förbi ett kompletterande skydd som redan har en
  fail-closed spärr bakom sig.
- Samma avvägning (sekundärt skydd → fail-open; primärt/auktoritativt skydd
  → fail-closed) är redan konsekvent genomförd i hela kodbasen: jämför
  `arChattIpSparrad`/`arKontaktformularIpSparrad` (fail-open) med
  `harAiBudget` och Turnstile-verifieringen i produktion (båda fail-closed).

### Konsekvens

Inget kodändras av detta beslut - det dokumenterar och bekräftar ett
mönster som redan fanns. Om Cloudflares `ratelimits`-bindning skulle sakna
tillgänglighet under en längre period bör det synas som ett eget
driftslarm (inte tystas bort som "förväntat"), men det är ett
observability-behov, inte ett skäl att ändra fail-open till fail-closed
här.

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
- **B2 (autentisering) – slutgiltigt bekräftat av ägaren 2026-07-29:**
  lösenord med tvingat byte vid första inloggning (redan byggt sedan
  Milstolpe 1). Passwordless/magic link övervägdes men valdes bort.
- **B3 (glömt lösenord) – slutgiltigt bekräftat av ägaren 2026-07-29:**
  ska byggas nu (Milstolpe 4b), innan bredare kundanvändning, i stället för
  att skjutas upp till Milstolpe 5.

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