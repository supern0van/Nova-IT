# E-post och DNS-handoff

Det här dokumentet samlar det manuella steget mellan Loopia och Cloudflare. Det ersätter inte Loopias installationsinstruktioner; använd alltid de exakta värden som visas i Loopias kundzon.

## Nuläge

- `nova-it.se` använder Cloudflare som auktoritativ DNS.
- Kontaktadresserna är förberedda: `kontakt@nova-it.se`, `support@nova-it.se` och `info@nova-it.se`.
- Publik DNS pekar fortfarande MX mot tidigare Strato: `smtp.rzone.de`.
- DMARC finns, men SPF och DKIM för Loopia är inte verifierade.

## Regel

Gör alla DNS-ändringar i Cloudflare, inte i Loopia. Ta inte bort befintliga Strato-poster förrän Loopias nya poster är inlagda och e-post är testad i båda riktningar.

## Checklista i Cloudflare

1. Öppna Loopia Kundzon och kopiera deras installationsposter för e-post exakt.
2. Öppna `nova-it.se` i Cloudflare och gå till **DNS > Records**.
3. Lägg in Loopias MX-poster, samt deras SPF- och DKIM-poster. E-postposter ska alltid vara **DNS only**, aldrig proxied.
4. Uppdatera eller ersätt den gamla MX-posten `smtp.rzone.de` när Loopias poster är klara.
5. Behåll en enda SPF-post på rotdomänen. Slå inte ihop flera `v=spf1`-poster.
6. Använd Loopias rekommenderade DKIM-selector och TXT/CNAME-värde utan att ändra tecken eller citattecken.
7. Justera DMARC först efter att utgående e-post fungerar. Börja försiktigt om Loopia rekommenderar det.
8. Testa in- och utgående e-post för alla tre adresser innan de visas på sajten.

## Vad som inte ska goras

- Inga e-postposter i Loopia när Cloudflare är namnserver.
- Ingen orange Cloudflare-proxy på MX, SPF, DKIM, DMARC eller autoconfig-poster.
- Inga lösenord, SMTP-nycklar eller DKIM-hemligheter i Git eller frontend-kod.

## Klart nar

- E-post kan skickas och tas emot från `kontakt@nova-it.se`.
- SPF och DKIM visar godkänt hos en e-posttesttjänst eller i Loopias kontroll.
- DMARC-posten är medvetet vald och dokumenterad.
- Kontaktformulärets e-postutkast testas med en riktig e-postklient.
