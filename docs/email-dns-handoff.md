# E-post och DNS-handoff

Senast uppdaterad: 2026-08-23

Det har dokumentet samlar nulaget for e-post, DNS och kontaktformular. Loopia hanterar brevladarna, Cloudflare hanterar publik DNS och Workers, och Resend ar tankt som teknisk avsandare for webbformularet.

**Status: klart, inte en pagaende migrering.** Upplagget har varit detsamma
sedan start - Loopia ager och sköter sjalva brevladorna, Cloudflare ager
publik DNS/namnserver-funktionen for `nova-it.se` framfor Loopia. Det ar
alltsa inte en flytt *fran* Strato/Loopia *till* Cloudflare, utan tva
leverantorer som alltid samarbetat: Loopia for e-post, Cloudflare for DNS och
webb. Livekontrollen 2026-08-03 (se nedan) bekraftade att posterna star ratt.
Fragan har dykt upp flera ganger som om den vore oppen - den ar det inte.

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

## Livefynd vid sakerhetsgenomgang 2026-08-03

Detta avsnitt ar en handoff for Cloudflare Dashboard/registrar-steg som inte ska
gissas in i kod:

- `nova-it.se` svarar med Loopias MX och en enda SPF-post:
  `v=spf1 include:spf.loopia.se -all`.
- DMARC finns men ar fortfarande i overvakat lage:
  `v=DMARC1; p=none; rua=mailto:kontakt@nova-it.se`. Skarp forst till
  `quarantine` och senare eventuellt `reject` nar in- och utleverans via Loopia
  och Resend ar verifierad.
- `resend._domainkey.nova-it.se` har fler an en TXT-post. En DKIM-selector ska
  normalt peka pa exakt ett public key-varde. Kontrollera Resends aktuella
  verifieringsvarde och ta bort gammal/duplicerad selector-post i Cloudflare.
- `nova-it.se` returnerade inget publikt DS-svar vid kontrollen. Om DNSSEC ar
  aktiverat i Cloudflare ska DS-posten aven laggas hos registrar/Loopia enligt
  Cloudflares DNSSEC-varde.
- `novait.se` saknade mailposter vid kontrollen. Om den domanen aldrig ska
  skicka e-post kan den med fordel fa en explicit skyddspolicy: SPF `v=spf1
-all` och DMARC `p=reject`, efter beslut.

Koden innehaller ett aterkorbart kontrollkommando:

```bash
bun run audit:cloudflare-live
```

Kommandot laser bara publika svar och ar tankt som granskningsstod, inte som
ersattning for Cloudflare Dashboard.
