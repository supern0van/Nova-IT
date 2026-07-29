# Kundportal – planeringsdokument

Senast uppdaterad: 2026-07-29
Status: **planeringsfas, inget byggarbete påbörjat**

## 0. Syfte med detta dokument

Det här dokumentet är skrivet för att vara **självständigt läsbart** - av mig (Claude)
i en helt ny konversation, av ChatGPT, eller av vem som helst som tar över arbetet,
utan tillgång till tidigare chatthistorik. Det ska innehålla tillräckligt med
sammanhang för att förstå *var vi kommer ifrån*, *vad som redan finns*, *vad som ska
byggas* och *i vilken ordning*, utan att gissa.

Om du läser det här utan att ha sett chatten som ledde fram till det: lita på det
som står här och i de dokument det länkar till (`docs/roadmap.md`, `docs/DECISIONS.md`,
`docs/project-status.md`), inte på antaganden om vad som "brukar" byggas i ett sånt
här projekt.

## 1. Bakgrund och nuvarande läge (kontext för en ny läsare)

Nova IT har idag två separata, redan levererade system:

1. **Den publika webbplatsen** (`nova-it.se`) - TanStack Start, Cloudflare Worker
   `supern0van-nova-it`. Kontaktformulär och supportassistent skickar in ärenden via
   en skyddad server-till-server-endpoint till adminportalen
   (`src/features/contact/contact-server.ts` → `portal/app/api/public/intag/route.ts`).
   Skyddas av en delad hemlighet (`INTAG_SECRET`), aldrig av besökarens egen session.

2. **Adminportalen** (`admin.nova-it.se`, repo-mapp `portal/`) - Next.js 16, egen
   Cloudflare Worker `nova-it-admin`, egen Supabase-databas (projekt-id
   `prarpdjrooxbzrpjudjp`). Nova IT:s **personal** (inte kunder) loggar in med
   Supabase Auth + obligatorisk MFA/TOTP (AAL2). Hanterar ärenden, kunder, bokningar,
   meddelanden och aktivitetslogg i tabellerna `admin_arenden`, `admin_kunder`,
   `admin_meddelanden`, `admin_bokningar`, `admin_aktiviteter`. Har nyligen fått en
   SMS-notifieringsfunktion ("klart för upphämtning", `lib/admin/sms-server.ts`, via
   46elks).

**Viktigt arkitekturmönster i adminportalen, som kundportalen bör återanvända:**
adminportalen litar **aldrig** på klientens egen Supabase-session för att avgöra
behörighet. All databasåtkomst går via skyddade Next.js Route Handlers som använder
service-rollnyckeln server-side (`lib/supabase/service.ts`), och kontrollerar
behörighet explicit i koden (`SystemRoll`, `Behorighet`, `harBehorighet()`). RLS
(Row Level Security) är medvetet **inte** den primära säkerhetsmekanismen idag - se
kommentaren i `20260727014500_profiler_och_roller.sql`: "RLS rekommenderas ändå som
försvar-på-djupet i ett senare steg". Detta mönster är **beprövat, testat och
levererat** - kundportalen bör följa samma princip snarare än att uppfinna en ny
RLS-baserad modell från grunden, eftersom RLS-baserad åtkomstkontroll är notoriskt
lätt att få fel och detta projekt redan valt bort det som primärt skydd.

**Redan fattat arkitekturbeslut (se `docs/roadmap.md`, sista raden under "Senare
beslut som kräver ägarinput", samt kommentar i `portal/wrangler.jsonc` rad ~25-27):**
kundportalen ska få **en egen Worker och egna routes** - den ska **inte** byggas in
i `nova-it-admin`. Domänerna `portal.novait.se`/`portal.nova-it.se` pekar idag
tillfälligt mot adminportalens Worker som en bekvämlighet (registrerade DNS-poster),
inte som en avsedd arkitektur - de ska pekas om till kundportalens egen Worker när
den byggs.

**Öppen fråga om databas:** roadmap.md nämner även en "egen databas". Det kan tolkas
som (a) ett helt separat Supabase-projekt, eller (b) samma Supabase-projekt som
adminportalen men med egna tabeller/schema. Se beslut B1 nedan - detta måste
beslutas innan Milstolpe 1 påbörjas.

## 2. Vad "kundportalen" faktiskt ska göra (scope v1)

Utifrån tidigare diskussion i det här projektet är de konkreta, uttryckligen
efterfrågade funktionerna:

1. **Kunden kan logga in** och se sina egna ärenden (status, historik,
   meddelanden) - kopplat till `admin_kunder`/`admin_arenden` via kundens e-post
   eller ett nytt kundkonto-id.
2. **Engångslösenord vid första inloggning:** när ett ärende skapas (via
   kontaktformulär, supportassistent eller adminportalen) ska kunden få ett
   tillfälligt lösenord i det första ärendemejlet, som måste bytas vid första
   inloggning till kundportalen.
3. Kunden kan se ärendets status och (rimligen, naturlig utvidgning) skriva ett
   svar/meddelande på ärendet, som dyker upp i adminportalens konversationsvy
   (`admin_meddelanden.avsandare = 'kund'` - kolumnen finns redan och stödjer
   redan detta värde, den fylls bara aldrig i av en riktig kund idag).

**Inte del av v1 (uttrycklig avgränsning, för att undvika scope creep - samma
disciplin som gällt hela den här sessionen för webbplatsarbetet):**

- Filuppladdning från kund.
- Betalningar, fakturor.
- Direkt kalenderbokning från kundportalen (adminportalen har redan bokningar,
  men kundinitierad bokning är en separat, senare utvidgning).
- AI-diagnostik eller chatt i kundportalen (skiljer sig från den publika
  supportassistenten, som redan finns).
- Gratis/öppen kontoregistrering - konton skapas alltid av att ett ärende skapas
  (via publikt intag eller adminportalen), aldrig av att en besökare själv
  registrerar sig fritt.

## 3. Kärnbeslut som måste fattas innan kodning börjar

Dessa är arkitekturbeslut, inte implementationsdetaljer - de påverkar allt
efterföljande arbete och bör antingen bekräftas av ägaren eller skrivas in i
`docs/DECISIONS.md` som ett nytt DEC-nummer innan Milstolpe 1 påbörjas.

### B1. Separat Supabase-projekt eller delat projekt med eget schema?

**Rekommendation:** separat Supabase-projekt. Skälen:
- Kundportalen har ett fundamentalt annat hot-scenario än adminportalen (öppen för
  alla kunder, mycket större användarbas, högre exponering) - att hålla den i en
  egen databas begränsar blast radius om något går fel.
- `roadmap.md` pekar redan åt det hållet ("egen databas").
- En egen Cloudflare Worker (redan beslutat, se ovan) pekar naturligt mot en egen
  miljökonfiguration ändå.

**Avvägning:** kräver att ärende-/kunddata synkas eller speglas mellan de två
projekten (adminportalen äger sanningen om ärenden, kundportalen behöver läsa den).
Enklast lösning: kundportalen har **ingen egen kopia** av ärendedata - den anropar
adminportalens skyddade API (liknande hur den publika sajten redan gör via
`INTAG_SECRET`) för att läsa/skriva ärenden, och har bara sin **egen** databas för
kundkontonas autentiseringsdata (kundkonto-id, koppling till `admin_kunder.id`,
lösenordshash-metadata om Supabase Auth används, `maste_byta_losenord`-flagga).

### B2. Autentiseringsmetod: lösenord med tvingat byte, eller passwordless (magic link)?

Den tidigare efterfrågade funktionen ("engångslösenord ... måste bytas vid
inloggning") pekar uttryckligen mot **lösenordsbaserad autentisering med tvingat
byte vid första inloggning**. Supabase Auth har **ingen inbyggd** "måste byta
lösenord"-flagga - det måste byggas som egen logik:

1. Ett konto skapas via Supabase Auth Admin API (`auth.admin.createUser`) med ett
   slumpmässigt genererat tillfälligt lösenord när ärendet skapas.
2. En egen tabell (t.ex. `kund_konton`) håller `maste_byta_losenord: boolean`,
   satt till `true` vid skapande.
3. Efter lyckad inloggning kontrollerar en server-check flaggan och tvingar
   användaren till en "byt lösenord"-vy innan något annat i portalen visas.
4. Det tillfälliga lösenordet skickas **endast** i det första ärendemejlet,
   **aldrig** loggas, **aldrig** visas i adminportalens gränssnitt efteråt.

**Alternativ att väga mot detta:** magic link (e-post-baserad engångsinloggning,
inget lösenord alls) är enklare att bygga säkert (inget lösenord att läcka, ingen
"tvinga byte"-logik behövs) och är Supabase Auths standardflöde. Om ägaren är öppen
för det är det den enklare, säkrare vägen. **Detta är ett beslut som bör bekräftas
explicit innan Milstolpe 2, inte antas.**

### B3. Hur kopplas ett kundkonto till en `admin_kund`-rad?

Rekommendation: en ny tabell `kund_konton` (i kundportalens egen databas) med
`admin_kund_id: text` (motsvarande `admin_kunder.id` i adminportalens databas,
lagrat som referens-text eftersom det är en annan databas - inte en riktig
foreign key över databasgränsen) och `auth_user_id: uuid` (Supabase Auth-användarens
id i kundportalens EGNA auth-schema). Kopplingen görs när ett ärende skapas: om
kundens e-post inte redan har ett `kund_konto`, skapa ett och skicka
välkomstmejlet med engångslösenordet.

### B4. Vem anropar vem?

Adminportalen (eller den publika sajtens intag-endpoint, vid ärendeskapande) måste
kunna trigga "skapa kundkonto + skicka välkomstmejl" i kundportalens system.
Rekommendation: samma mönster som `INTAG_SECRET` - en ny skyddad
server-till-server-endpoint i kundportalens Worker
(`POST /api/internal/kundkonto`), skyddad med en egen delad hemlighet
(`KUNDPORTAL_INTAG_SECRET` eller liknande, **aldrig** samma värde som
`INTAG_SECRET`), anropad från adminportalens `skapaOperativtArende()`/
`skapaPubliktIntag()` efter att ett ärende sparats.

## 4. Säkerhetsprinciper (icke förhandlingsbara, ärvda från hela detta projekt)

- Aldrig secrets eller service-role-nycklar i klientkod.
- Fail-closed: om en behörighetskontroll inte kan avgöras, neka - visa aldrig data
  av misstag.
- Ett misslyckat e-postutskick (t.ex. välkomstmejlet med engångslösenordet) får
  aldrig tolkas som att kontot inte skapades - samma `bekraftelse_status`-mönster
  som redan finns för det publika intaget bör återanvändas/speglas.
- Kundens session får **aldrig** kunna läsa eller skriva någon annan kunds data -
  varje serverfunktion som läser/skriver kunddata måste explicit filtrera på den
  inloggade kundens egna `admin_kund_id`, oavsett vad klienten skickar in.
- Rate limiting och spamskydd på inloggning/lösenordsbyte (samma typ av
  resonemang som Turnstile/honeypot på kontaktformuläret).
- Ingen quiet fallback som låtsas lyckas - matchar principen som redan gäller
  för kontaktformuläret ("en misslyckad databasskrivning får aldrig se ut som en
  lyckad skickning").

## 5. Milstolpar

Varje milstolpe ska avslutas med gröna kvalitetsgrindar (`test`/`lint`/`typecheck`/
`build`, samma konvention som resten av projektet) och en verifiering i webbläsare
innan den räknas som klar - **exakt samma regel som gällt hela den här sessionen:
varje steg ska lämna det som redan finns i fungerande skick.**

### M0 - Beslut och grundstruktur
- Bekräfta B1-B4 ovan (eller skriv nya DEC-poster i `docs/DECISIONS.md` som ändrar
  dem).
- Skapa det nya repot/Workern (eller ny mapp i monorepot, beroende på B1-utfallet)
  med minimal skelett: Next.js- eller TanStack-app, CI-pipeline (spegla
  `documentation-guard.yml`/`ci.yml`-mönstret), tomt Supabase-projekt.
- **Klar när:** ett "Hello world"-skydd finns deployat på en riktig subdomän,
  CI är grönt, inget riktigt innehåll än.

### M1 - Datamodell och autentisering
- Migrationer: `kund_konton` (se B3), Supabase Auth-konfiguration för
  kundportalens projekt.
- Inloggningsflöde: e-post + (tillfälligt) lösenord, tvingat lösenordsbyte om
  `maste_byta_losenord = true` (eller magic link, beroende på B2).
- **Klar när:** ett manuellt skapat testkonto kan logga in, tvingas byta lösenord,
  och når en tom "inloggad"-vy. Inga ärendedata visas än.

### M2 - Skapa kundkonto automatiskt vid ärende
- Bygg `POST /api/internal/kundkonto` (se B4) i kundportalens Worker.
- Koppla in anropet från adminportalens `skapaOperativtArende()` och den publika
  sajtens intagsflöde (`skapaPubliktIntag()`), efter att ärendet redan sparats -
  **aldrig** som en förutsättning för att ärendet ska räknas som skapat.
- Bygg välkomstmejlet med engångslösenordet (Resend, samma avsändarmönster som
  redan finns för kundbekräftelser).
- **Klar när:** ett riktigt ärende skapat via `/kontakt` på `nova-it.se` resulterar
  i ett välkomstmejl med ett fungerande engångslösenord, verifierat end-to-end i en
  testmiljö (inte mot skarpa kunder).

### M3 - Visa egna ärenden
- Skyddad läs-endpoint: kundportalen anropar adminportalens API (eller läser sin
  egen speglade delmängd, beroende på B1) för att visa kundens ärenden: status,
  senaste uppdatering, konversationshistorik.
- **Klar när:** en inloggad testkund ser exakt sina egna ärenden, aldrig andras.

### M4 - Kundinitierat svar på ärende
- Kunden kan skriva ett meddelande på ett öppet ärende, som sparas i
  `admin_meddelanden` med `avsandare: 'kund'` och syns i adminportalens
  konversationsvy.
- **Klar när:** ett meddelande skrivet i kundportalen dyker upp i adminportalens
  ärendevy inom rimlig tid, med rätt avsändarmärkning.

### M5 - Härdning och release-granskning
- Extern säkerhetsgenomgång av hela autentiseringsflödet (motsvarande den
  release-readiness-granskning som redan gjordes för adminportalen).
- Legal/integritetsinnehåll granskas på nytt innan lansering - `project-status.md`
  pekar redan ut detta som ett krav innan en persondatatung tjänst som en
  kundportal introduceras.
- Rate limiting, loggning utan att läcka personuppgifter, DECISIONS.md uppdaterad.
- **Klar när:** samma GO/CONDITIONAL GO/NO-GO-process som användes för
  adminportalens release körs och landar på GO.

### M6 - Lansering
- DNS: peka om `portal.nova-it.se`/`portal.novait.se` (eller nya domäner) från
  adminportalens Worker till kundportalens egen Worker.
- Uppdatera `docs/roadmap.md`, `docs/DECISIONS.md`, skriv ett changelog-fragment.

## 6. Arbetssätt under bygget (samma konventioner som redan etablerats)

- Varje betydande ändring: `test`/`lint`/`typecheck`/`build` grönt innan commit.
- Changelog-fragment i `docs/changes/NOVA-XXXX-....md` för varje betydande PR.
- Större vägval (särskilt B1/B2 ovan när de är slutgiltigt beslutade) skrivs som
  en ny post i `docs/DECISIONS.md`.
- Inga produktionsmigrationer eller produktionsdeployer förrän hela kedjan för
  den aktuella milstolpen är grön och granskad - samma regel som redan gällt hela
  den här sessionen.
- Verifiera i webbläsare innan något markeras klart, inte bara att koden
  kompilerar.

## 7. Kända risker och öppna frågor

- **Parallell session i samma repo:** vid tidpunkten det här dokumentet skrevs
  pågick en annan, okoordinerad arbetssession i samma kodbas (namnbyten i
  autentiseringskoden, en "demogäst"-vy m.m.). Innan M0 påbörjas: kontrollera att
  `main` är grönt (`git log`, CI-status) och att ingen annan session är mitt i
  ett auth-relaterat refaktoreringsarbete som skulle kunna kollidera med
  kundportalens autentiseringsarbete.
- **B1/B2 är inte slutgiltigt beslutade** - rekommendationerna ovan är mina, inte
  bekräftade av ägaren än. Bygg inte M1 förrän de är bekräftade eller medvetet
  ändrade.
- **Engångslösenord i e-post är i sig en känslig leveransmekanism** - om Resend-
  leveransen misslyckas eller mejlet hamnar i skräppost förlorar kunden sin enda
  väg in. Överväg om M2 även bör ge kunden ett sätt att begära ett nytt
  engångslösenord (t.ex. "glömt lösenord"-flöde) redan i första versionen, inte
  som en efterhandskonstruktion.

## 8. Referenser

- `docs/roadmap.md` - "Senare beslut som kräver ägarinput"-sektionen.
- `docs/DECISIONS.md` - beslutslogg, format att följa för nya beslut.
- `docs/project-status.md` - kravet på ny legal/integritetsgranskning före en
  persondatatung tjänst.
- `portal/wrangler.jsonc` - kommentar om att kundportalen kräver egen Worker.
- `portal/supabase/migrations/20260727014500_profiler_och_roller.sql` - motivering
  för varför adminportalen inte primärt förlitar sig på RLS.
- `portal/supabase/migrations/20260728165528_admin_operativa_tabeller.sql` -
  nuvarande `admin_arenden`/`admin_kunder`/`admin_meddelanden`-schema.
- `docs/contact-form-activation.md` - mönster för soft-fail-designade externa
  integrationer (Turnstile, SMS) som kundportalens autentiseringsmejl bör följa.
