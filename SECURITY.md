# Säkerhetspolicy

## Stödda versioner

Nova IT:s publika webbplats versionssätts inte som ett publikt bibliotek. Säkerhetsunderhåll gäller därför:

- aktuell `main`-gren
- den version av webbplatsen som är aktiv i produktion på `nova-it.se`

Äldre commits, lokala utvecklingsgrenar och utgångna preview-deployments betraktas inte som separata stödda versioner.

## Rapportera en sårbarhet

Rapportera misstänkta säkerhetsproblem privat till **webmaster@nova-it.se**. Lägg inte känsliga säkerhetsfynd, hemligheter eller personuppgifter i ett publikt GitHub-issue.

Ta gärna med:

- vilken del som berörs
- en kort beskrivning av problemet och möjlig påverkan
- reproduktionssteg eller proof-of-concept som inte använder riktiga kunduppgifter
- berörd URL, route, commit eller fil om det är känt
- förslag på åtgärd, om du har ett

Skicka aldrig lösenord, API-nycklar, sessionscookies eller riktiga personuppgifter som reproduktionsdata.

Målsättningen är att bekräfta en rapport inom tre arbetsdagar. Kritiska fynd prioriteras omedelbart. När problemet är verifierat görs åtgärd, test och driftsättning utifrån risk och påverkan.

## Samordnad publicering

Publicera inte detaljer om en verifierad sårbarhet innan en åtgärd har kunnat tas fram och driftsättas. När det är relevant samordnas tidpunkt för offentlig information med rapportören.

Den publika webbplatsen publicerar även kontaktinformation för säkerhetsrapportering via `/.well-known/security.txt`.
