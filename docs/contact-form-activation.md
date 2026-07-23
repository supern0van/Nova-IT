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
