# Nova IT – beslutslogg

Beslutsloggen förklarar större vägval. Den kompletterar changelogen: changelogen visar vad som förändrades, medan denna fil visar varför en riktning valdes framför andra alternativ.

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