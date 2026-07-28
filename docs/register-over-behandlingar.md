# Internt register över personuppgiftsbehandlingar

Detta register är en första arbetsversion för Nova IT:s publika webbplats och kontaktflöde. Det ska hållas uppdaterat när leverantörer, ändamål, lagringstider eller tekniska flöden ändras. Dokumentet är internt och ska inte publiceras som kundinformation utan en separat bedömning.

## Ansvar och kontakt

- Personuppgiftsansvarig för Nova IT:s egna webbplatsbehandlingar: Nova IT
- Kontakt: kontakt@nova-it.se
- Dataskyddsombud: inget särskilt dataskyddsombud utsett i denna version
- Senast granskad: 2026-07-29

## Registerposter

| Behandling                        | Ändamål                                                          | Registrerade                    | Personuppgifter                                                                    | Mottagare/biträden                                                | Lagring                                                                                                                                 | Rättslig grund / instruktion                                      |
| --------------------------------- | ---------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Kontaktförfrågan via webbformulär | Ta emot, besvara och följa upp en första kundkontakt             | Besökare och kontaktpersoner    | Namn, e-post, telefon, vald hjälp, prioritet och meddelande                        | Resend för e-postleverans; Cloudflare för drift och säkerhet      | Förfrågningar som inte leder till ärende gallras senast 12 månader efter senaste kontakt; längre lagring kan följa av uppdrag eller lag | Berättigat intresse; åtgärder inför avtal när relevant            |
| Direkt e-postkontakt              | Besvara och administrera inkommande e-post                       | Personer som kontaktar Nova IT  | Kontaktuppgifter och innehåll i meddelandet                                        | E-postleverantör; Cloudflare där trafiken skyddas av deras tjänst | Så länge det behövs för kontakt, uppdrag eller rättslig skyldighet                                                                      | Berättigat intresse; avtal eller rättslig skyldighet när relevant |
| Drift- och säkerhetsloggar        | Tillgänglighet, felsökning, missbruksskydd och incidenthantering | Besökare och tekniska användare | IP-adress, tidpunkt, tekniska metadata och säkerhetshändelser                      | Cloudflare och driftleverantörer enligt aktuell konfiguration     | Enligt leverantörernas konfiguration och Nova IT:s säkerhetsbehov; gallring ska dokumenteras när konfigurationen är fastställd          | Berättigat intresse och rättslig skyldighet när relevant          |
| Samtyckesval för valfria tekniker | Spara besökarens val och respektera återkallelse                 | Besökare                        | Val för statistik och marknadsföring, tidpunkt och teknisk kontext i lokal lagring | Ingen extern mottagare i nuvarande version                        | Tills besökaren ändrar eller raderar valet                                                                                              | Samtycke för valfria tekniker                                     |

## Biträdes- och säkerhetskontroll

För varje leverantör som behandlar personuppgifter för Nova IT:s räkning ska ansvar, instruktioner, säkerhetsåtgärder, underbiträden, incidentrapportering, lagring och radering dokumenteras i avtal eller annan rättsakt. En tjänst får inte kopplas in i produktion innan den kontrollen är genomförd.

## Tredjelandsöverföringar

Kontrollera inför varje leverantörsändring om personuppgifter kan behandlas utanför EU/EES. Dokumentera överföringsgrund och kompletterande skyddsåtgärder i leverantörsbedömningen.

## Uppföljning

Registret ska ses över minst årligen och dessutom vid ny leverantör, nytt formulär, ny analys-/marknadsföringsteknik, ändrad lagringstid eller personuppgiftsincident.

> Arbetsdokument: juridisk och teknisk granskning krävs innan registret används som fullständig compliance-dokumentation.
