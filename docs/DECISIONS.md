# Nova IT – beslutslogg

Beslutsloggen förklarar större vägval. Den kompletterar changelogen: changelogen visar vad som förändrades, medan denna fil visar varför en riktning valdes framför andra alternativ.

## DEC-0007 – Robotassistent, prissättning och kontaktuppgifter (ägarbeslut)

**Status:** accepterat
**Datum:** 2026-08-23

### Bakgrund

Tre öppna punkter från `docs/roadmap.md`s "Senare beslut som kräver
ägarinput" behövde avgöras innan vidare kodarbete: robotassistentens
framtida arkitektur, om/när priser ska visas, och vilka kontaktuppgifter som
faktiskt är korrekta.

### Beslut

- **Robotassistenten:** är sedan tidigare (NOVA-0040/0043/0044/0047/0048)
  kopplad till Cloudflare Workers AI - regelmotorn i `support-engine.ts` är
  inte längre hela bilden, det finns redan ett LLM-klassificeringslager
  ovanpå den (se `support-ai.ts`/`support-ai-server.ts`). Assistenten är
  dock helt avstängd på live-sajten sedan 2026-08-21 (NOVA-0061,
  `SUPPORT_ASSISTANT_IS_ONLINE = false`). Beslutet 2026-08-23 var att den
  ska förbättras vidare - men eftersom AI-lagret redan finns behöver nästa
  steg utredas mot dagens kod (t.ex. om AI-vägen faktiskt användes i
  produktion innan avstängningen), inte byggas om från grunden. Ingen
  koppling till ett separat ärendesystem planeras just nu; i stället
  prioriteras en bättre admin-dashboard där fler funktioner automatiseras -
  däribland att koppla in Nova IT:s Loopia-mejlkonton som en funktion i
  adminportalen.
- **Priser:** marknadsresearch genomförd 2026-08-23 (se
  `docs/priser-arbetsdokument.md`, källor från svensk IT-supportmarknad).
  Stefan sätter faktiska priser utifrån underlaget. Publiceras inte på den
  publika sajten förrän bolaget går live.
- **Kontaktuppgifter:** e-post (`kontakt@nova-it.se`), telefon
  (076-225 20 39), geografiskt område (Hässelby), bolagsform (enskild
  firma, Stefan Bergstrand, org.nr 19870528-0652) är fastställda och
  dokumenterade i `docs/project-status.md`. Hemadressen förblir avsiktligt
  utanför den publika sajten (se NOVA-0055) - endast interna/juridiska
  dokument innehåller den. Telefonnumret är heller inte publicerat på
  live-sajten ännu.

### Konsekvens

Assistentens ombyggnad och en admin-dashboard med automation blir framtida
utvecklingsspår. Prissidan/-informationen ska inte kodas in på ett sätt som
gör den synlig på `nova-it.se` förrän publiceringsvillkoren i
`docs/priser-arbetsdokument.md` är uppfyllda. Framtida kontakt-relaterad
kod/text ska stämma med tabellen i `docs/project-status.md`.

---

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