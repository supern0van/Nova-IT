# Aktivering av kontaktformularet

Senast uppdaterad: 2026-07-22

## Syfte

Kontaktformularet ska skicka ett arende direkt till Nova IT utan att besokaren behover oppna sin egen e-postapp. Det ska inte fungera som en enkel `mailto:`-lank.

Flodet ar:

1. Besokaren skickar formularet pa `nova-it.se`.
2. Cloudflare Worker validerar uppgifterna pa serversidan.
3. Resend skickar ett e-postmeddelande till `kontakt@nova-it.se`.
4. Meddelandet skickas fran `Nova IT <no-reply@nova-it.se>`.
5. Besokarens e-postadress satts som `Reply-To`, sa att svaret fran Nova IT gar direkt till personen som skickade arendet.

Webbplatsen lagrar inte arendet i en egen databas. Resend anvands som teknisk e-postleverantor och Loopia tar emot e-post i Nova IT:s brevladar.

## Fordelning av adresser

| Adress | Anvandning |
| --- | --- |
| `kontakt@nova-it.se` | Publik kontaktadress och mottagare av webbformularets arenden. |
| `support@nova-it.se` | Supportadress som kan anvandas i direkt dialog med kund. |
| `info@nova-it.se` | Allman administrativ adress. Visas inte som huvudkontakt tills vidare. |
| `webmaster@nova-it.se` | Teknisk/admin adress, bland annat for konton och drift. Ska inte vara publik huvudkontakt. |
| `no-reply@nova-it.se` | Teknisk avsandare for formularet. Ska inte anvandas som kontaktvag och behover inte bevakas som inkorg. |

## DNS-regel

Cloudflare ar publik DNS for `nova-it.se`, medan Loopia hanterar brevladarna. Darfor ska e-postposter skotas i Cloudflare och peka mot Loopias varden.

- MX-poster ska ligga pa rotdomanen `nova-it.se`, inte per enskild adress som `webmaster@nova-it.se`.
- MX, SPF, DKIM, DMARC och autoconfig-poster ska vara `DNS only`.
- Blanda inte Cloudflare Email Routing MX med Loopias MX om Loopia ska vara e-posttjansten.
- Gamla Strato/Rzone-poster som `smtp.rzone.de`, `autoconfigure.strato.de` och `rzone.de` ska inte ligga kvar i aktiv konfiguration.
- SPF ska finnas som en enda TXT-post pa rotdomanen. Om Resend behover SPF senare ska vardet slas ihop korrekt, inte skapas som en andra SPF-post.
- DKIM-varden ska kopieras exakt fran Loopia respektive Resend nar avsandaren verifieras.

## Hemligheter i Cloudflare

Skapa en Resend-nyckel med minsta mojliga behorighet for e-postutskick. Skriv aldrig nyckeln i chatten, i Git, i `.env.example` eller i frontendkod.

Fran projektmappen, efter en lyckad build:

```powershell
bun run build
bunx wrangler secret put RESEND_API_KEY --config .output/server/wrangler.json
bunx wrangler secret put CONTACT_FORM_FROM --config .output/server/wrangler.json
bunx wrangler secret put CONTACT_FORM_TO --config .output/server/wrangler.json
```

Ange dessa varden nar Wrangler fragar:

```text
CONTACT_FORM_FROM = Nova IT <no-reply@nova-it.se>
CONTACT_FORM_TO = kontakt@nova-it.se
```

Deploya sedan den granskade versionen med den vanliga produktionsrutinen:

```powershell
bun run deploy:production
```

Cloudflare-kontots inloggningsadress paverkar inte formularets funktion. Bytet till `webmaster@nova-it.se` kan goras separat nar Cloudflare godkanner andringen.

## Verifiering i skarp miljo

1. Skicka ett test genom kontaktformularet pa `https://nova-it.se/kontakt` med en egen extern testadress.
2. Bekrafta att sidan visar lyckat skickat utan att oppna en e-postapp.
3. Bekrafta att meddelandet kommer till `kontakt@nova-it.se` och innehaller ratt tjanst, prioritet och beskrivning.
4. Svara direkt pa meddelandet och bekrafta att svaret gar till testadressens e-post.
5. Testa formularet pa mobil och desktop.
6. Kontrollera skrappostmappen under de forsta testen och justera Resend-verifieringen om leveransen inte ar stabil.

## Fore bred lansering

Kontaktformularet bor fa Cloudflare Turnstile och en enkel begransning av upprepade skick innan det marknadsfors brett. Det minskar spam och onodiga kostnader utan att lagga en tung inloggning framfor kunden.

Status (2026-07-29): honeypot- och tidskontrollen ar redan byggda och aktiva i koden (`src/features/contact/contact-server.ts`). Turnstile-koden (klient + server) ar ocksa byggd men soft-fail:ar tills nycklarna nedan ar satta - se korordern nedan for att aktivera den skarpt.

## Kororder: aktivera ratebegransning, Turnstile och INTAG_SECRET

Dessa steg kraver inloggning i Cloudflare Dashboard och kan darfor inte utforas av assistenten - de listas har som en konkret att-gora-lista, i rekommenderad ordning.

### 1. INTAG_SECRET (delad hemlighet mellan de tva Workers)

Kravs for att den publika sajtens kontaktformular ska kunna skapa arenden i adminportalen via `/api/public/intag`. Samma varde maste finnas pa **bada** Workers.

1. Generera ett langt slumpmassigt varde, t.ex.:
   ```powershell
   openssl rand -hex 32
   ```
2. Satt det pa den publika sajtens Worker (fran repots rot, efter en lyckad `bun run build`):
   ```powershell
   bun run build
   bunx wrangler secret put INTAG_SECRET --config .output/server/wrangler.json
   bunx wrangler secret put ADMIN_INTAKE_URL --config .output/server/wrangler.json
   ```
   `ADMIN_INTAKE_URL` = `https://admin.nova-it.se` (adminportalens Worker-URL, utan avslutande snedstreck).
3. Satt **exakt samma** `INTAG_SECRET`-varde pa adminportalens Worker:
   ```powershell
   cd portal
   bunx wrangler secret put INTAG_SECRET
   ```
4. Deploya bada Workers med de vanliga produktionsrutinerna (`bun run deploy:production` i respektive mapp) sa att de nya hemligheterna borjar anvandas.
5. Verifiera: skicka ett testarende via `/kontakt` pa `nova-it.se` och bekrafta att det dyker upp som ett riktigt arende i adminportalen (inte bara ett e-postmeddelande).

### 2. Cloudflare Turnstile

1. Ga till Cloudflare Dashboard -> Turnstile -> Add site. Domain: `nova-it.se`. Widget mode: rekommenderas "Managed".
2. Kopiera **Site Key** (publik) och **Secret Key** (hemlig).
3. Sätt Site Key som `TURNSTILE_SITE_KEY` på den publika sajtens Worker. Den är avsedd att exponeras i webbläsaren, men hämtas via en serverfunktion vid runtime så att den inte behöver byggas in i klientbunten:
   ```powershell
   bunx wrangler secret put TURNSTILE_SITE_KEY --config .output/server/wrangler.json
   ```
   Äldre installationer med secret-namnet `VITE_TURNSTILE_SITE_KEY` stöds tillfälligt av koden, men bör migreras till `TURNSTILE_SITE_KEY`.
4. Satt Secret Key server-side, ENDAST pa den publika sajtens Worker (aldrig i adminportalen, aldrig i klientkod):
   ```powershell
   bunx wrangler secret put TURNSTILE_SECRET_KEY --config .output/server/wrangler.json
   ```
5. Bygg och deploya om (`bun run deploy:production`).
6. Verifiera: ladda `/kontakt?form=request` i en vanlig webbläsare, gå igenom formuläret och bekräfta att Turnstile-widgeten visas precis före den slutliga knappen **Skicka ärendet**. Skicka ett testarende och bekräfta att det fortfarande fungerar.

Tills bada nycklarna ar satta fungerar formularet exakt som idag (ingen Turnstile-kontroll genomfors) - se `verifieraTurnstile()` i `contact-server.ts`.

### 3. Ratebegransning (Cloudflare Dashboard, inte Workers-kod)

Rekommenderat: en Rate Limiting Rule pa zonniva (Security -> WAF -> Rate limiting rules), inte ny kod i Workern.

- **Regel 1** - kontaktformularets sidvisning/inskick: matcha `URI Path` `equals` `/kontakt`, trosklevarde t.ex. **20 forfragningar per minut per IP**, atgard **Managed Challenge** (inte "Block", eftersom aktiveringssidan besoks av legitima kunder aven vid hog trafik).
- **Regel 2** - sjalva intags-endpointen: matcha `URI Path` `equals` `/api/public/intag`, trosklevarde t.ex. **10 forfragningar per minut per IP**, atgard **Block** (den anropas bara av den egna servern-till-server-koden och supportassistentens flode, aldrig direkt av en vanlig anvandares webblasare i normalt bruk).

Justera troskelvardena efter faktisk trafik nar de forsta veckorna har gett en baslinje.

## Beslutat: bygg inte "Forsok skicka bekraftelse igen" nu

En admin-knapp for att manuellt forsoka skicka om en misslyckad kundbekraftelse (nar `bekraftelse_status = 'misslyckad'`) diskuterades men byggs inte i denna omgang.

Skal: adminportalen har inga Resend-nycklar idag, och att lagga till dem dar skulle dubblera e-postkonfigurationen i tva separata Workers. Alternativet - att adminportalen anropar den publika sajtens `createServerFn`-endpoint over natverket - ar inte ett monster TanStack Start ar byggt for (den typen av serverfunktioner ar tankta att anropas av den egna appens klient, inte fran en extern tjanst) och skulle bli en skor, odokumenterad genvag.

Om behovet blir stort (t.ex. manga misslyckade bekraftelser i praktiken) bor detta byggas som en egen, avgransad uppgift - troligen genom att lagga till en tredje, liten skyddad endpoint i den publika sajten (`/api/intern/skicka-bekraftelse-igen` e.d.) som adminportalen far anropa med samma `INTAG_SECRET`-monster som redan finns, snarare an att adminportalen skickar e-post sjalv.
