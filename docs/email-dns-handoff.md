# E-post och DNS-handoff

Senast uppdaterad: 2026-07-22

Det har dokumentet samlar nulaget for e-post, DNS och kontaktformular. Loopia hanterar brevladarna, Cloudflare hanterar publik DNS och Workers, och Resend ar tankt som teknisk avsandare for webbformularet.

## Nulage

- `nova-it.se` anvander Cloudflare som auktoritativ DNS och Cloudflare Worker for webbplatsen.
- Loopia hanterar brevladarna.
- Aktiva adresser ar `kontakt@nova-it.se`, `support@nova-it.se`, `info@nova-it.se`, `webmaster@nova-it.se` och `no-reply@nova-it.se`.
- Publikt visar webbplatsen i forsta hand `kontakt@nova-it.se`.
- `no-reply@nova-it.se` ar reserverad som teknisk avsandare for formular och systemmeddelanden.
- E-post fungerar in och ut enligt senaste manuella test.

## Ansvarsfordelning

- DNS andras i Cloudflare eftersom Cloudflare ar namnserver.
- Brevlador och inloggningar hanteras i Loopia.
- Webbsidans kontaktformular ska skicka till `kontakt@nova-it.se`.
- Cloudflare-kontots inloggningsadress kan bytas till `webmaster@nova-it.se` separat; det paverkar inte DNS eller formularflodet.

## Poster som ska finnas

Kontrollera alltid mot Loopias aktuella instruktioner, men principen ar:

- Worker-poster for `nova-it.se` och `www.nova-it.se`.
- Loopias MX-poster pa rotdomanen `nova-it.se`.
- En SPF-post pa rotdomanen som galler for den valda e-posttjansten.
- Loopias DKIM-post exakt enligt Loopias varde.
- DMARC-post med medveten policy.
- Autoconfig/autodiscover endast om de behovs for Loopias e-postklientinstallningar.

Alla e-postrelaterade poster ska vara `DNS only`.

## Poster som inte ska ligga kvar

- Gamla Strato/Rzone-varden som `smtp.rzone.de`, `autoconfigure.strato.de` eller DKIM mot `rzone.de`.
- Cloudflare Email Routing MX om Loopia ska ta emot e-post.
- Orange proxy pa MX, SPF, DKIM, DMARC, autoconfig eller autodiscover.
- MX-poster per enskild adress som `webmaster@nova-it.se`. MX ligger pa domanen, inte pa varje brevlada.

## Kontaktformular

Nar formularet aktiveras ska det anvanda:

- Mottagare: `kontakt@nova-it.se`
- Avsandare: `Nova IT <no-reply@nova-it.se>`
- Reply-To: besokarens ifyllda e-postadress

Resend kan krava egna verifieringsposter. De ska laggas till exakt enligt Resends granssnitt, men SPF far inte dubblas. Om bade Loopia och Resend behover SPF ska det slas ihop till en enda korrekt `v=spf1`-post.

## Klart nar

- Alla fem Nova IT-adresser kan ta emot e-post.
- Minst en Nova IT-adress kan skicka till Gmail utan att fastna.
- `kontakt@nova-it.se` ar publik kontaktadress i webbplatsen.
- Kontaktformularet levererar direkt till `kontakt@nova-it.se` utan att oppna besokarens e-postapp.
- Svar pa formularmeddelanden gar tillbaka till besokarens ifyllda e-postadress.
