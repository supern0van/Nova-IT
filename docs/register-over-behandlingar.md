# Internt register över personuppgiftsbehandlingar

Detta register är en första arbetsversion för Nova IT:s publika webbplats, kontaktflöde och kundportal. Det ska hållas uppdaterat när leverantörer, ändamål, lagringstider eller tekniska flöden ändras. Dokumentet är internt och ska inte publiceras som kundinformation utan en separat bedömning.

## Ansvar och kontakt

- Personuppgiftsansvarig för Nova IT:s egna webbplatsbehandlingar: Nova IT
- Kontakt: kontakt@nova-it.se
- Dataskyddsombud: inget särskilt dataskyddsombud utsett i denna version
- Senast granskad: 2026-08-16

## Registerposter

| Behandling                             | Ändamål                                                          | Registrerade                    | Personuppgifter                                                                             | Mottagare/biträden                                                                                            | Lagring                                                                                                                                 | Rättslig grund / instruktion                                       |
| -------------------------------------- | ---------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Kontaktförfrågan via webbformulär      | Ta emot, besvara och följa upp en första kundkontakt             | Besökare och kontaktpersoner    | Namn, e-post, telefon, vald hjälp, prioritet och meddelande                                 | Resend för e-postleverans; Cloudflare för drift och säkerhet                                                  | Förfrågningar som inte leder till ärende gallras senast 12 månader efter senaste kontakt; längre lagring kan följa av uppdrag eller lag | Berättigat intresse; åtgärder inför avtal när relevant             |
| Direkt e-postkontakt                   | Besvara och administrera inkommande e-post                       | Personer som kontaktar Nova IT  | Kontaktuppgifter och innehåll i meddelandet                                                 | E-postleverantör; Cloudflare där trafiken skyddas av deras tjänst                                             | Så länge det behövs för kontakt, uppdrag eller rättslig skyldighet                                                                      | Berättigat intresse; avtal eller rättslig skyldighet när relevant  |
| Drift- och säkerhetsloggar             | Tillgänglighet, felsökning, missbruksskydd och incidenthantering | Besökare och tekniska användare | IP-adress, tidpunkt, tekniska metadata och säkerhetshändelser                               | Cloudflare och driftleverantörer enligt aktuell konfiguration                                                 | Enligt leverantörernas inställningar och bara så länge de behövs för drift, felsökning och incidenthantering                            | Berättigat intresse och rättslig skyldighet när relevant           |
| Samtyckesval för valfria tekniker      | Spara besökarens val och respektera återkallelse                 | Besökare                        | Val för statistik och marknadsföring, tidpunkt och teknisk kontext i lokal lagring          | Ingen extern mottagare i nuvarande version                                                                    | Tills besökaren ändrar eller raderar valet                                                                                              | Samtycke för valfria tekniker                                      |
| Kundportalens konto och inloggning     | Ge kunden inloggning för att se och svara på sina egna ärenden   | Kunder med registrerat ärende   | E-post, en tidsbegränsad engångslänk för aktivering/återställning (endast i ett engångsmejl, aldrig loggad - inget lösenord passerar genom våra system, kunden väljer sitt eget när länken löses in), inloggningshistorik | Supabase (databas och autentisering, kundportalens EGET, separata projekt); Cloudflare för drift och säkerhet | Kontot består så länge kundrelationen är aktiv; spärras eller raderas vid avslutad relation eller på begäran när lag/avtal tillåter     | Berättigat intresse/avtal - fullgörande av support-/serviceavtalet |
| Kundportalens ärenden och konversation | Visa kundens egna ärenden och ta emot kundens svar               | Kunder med registrerat ärende   | Ärenderubrik, status, prioritet, konversationstext kunden själv skrivit                     | Supabase (samma projekt som ovan); adminportalen (samma uppgifter som redan behandlas där för ärendet)        | Följer ärendets egen livscykel/lagringstid i adminportalen - ingen separat kopia utöver kundportalens egen `kund_konton`-koppling       | Berättigat intresse/avtal - fullgörande av support-/serviceavtalet |

### Supportguiden på den publika webbplatsen

| Behandling | Ändamål | Registrerade | Personuppgifter | Mottagare/biträden | Lagring | Rättslig grund / instruktion |
| ---------- | ------- | ------------ | --------------- | ------------------ | ------- | ---------------------------- |
| Supportguidens underlag i webbläsaren | Föra kundens beskrivning och val vidare till kontaktformuläret | Besökare | Fritextbeskrivning kunden själv skrivit, valt område, påverkan och tidsbild | Ingen extern mottagare - lagras bara i besökarens egen webbläsare | Sessionslagring, högst 30 minuter, raderas när den använts eller när fliken stängs | Berättigat intresse - att kunna ta emot en begriplig förfrågan |
| Guidad dialog som del av ärendet | Ge Nova IT kundens egna ord och gjorda val direkt i ärendet i stället för att fråga om grunderna igen | Personer som skickar en förfrågan | Kundens fritext och de val kunden gjort i guiden, som del av ärendets beskrivning | Adminportalen (samma ärende som redan behandlas där); Cloudflare för drift | Följer ärendets egen lagringstid - ingen separat kopia | Berättigat intresse; åtgärder inför avtal när relevant |
| Automatisk kategoriförslag med AI | Föreslå rätt ärendeområde och sammanfatta problemet för kundens bekräftelse | Besökare som skriver i guiden | Kundens fritextbeskrivning, kapad till 600 tecken | Cloudflare Workers AI (befintligt biträde - ingen ny leverantör) | Ingen lagring hos Nova IT; anropet är tillfälligt och svaret sparas inte | Berättigat intresse - att sortera förfrågningar rätt |

**Anmärkning om AI-behandlingen.** Förslaget är rådgivande. Kunden väljer själv
om området ska bytas, och en människa hanterar alltid ärendet. Behandlingen
utgör därför inte ett automatiserat beslut enligt artikel 22, eftersom den
varken har rättsliga följder eller på liknande sätt i betydande grad påverkar
den registrerade. Modellen körs hos Cloudflare, som redan är biträde för
webbdriften, vilket innebär att **inget nytt personuppgiftsbiträde tillkommer**.
Kundens text används inte för modellträning. Funktionen är avstängd som
standard (`SUPPORT_AI_LAGE`) - se
[`supportassistent-ai-drift.md`](supportassistent-ai-drift.md).

Gallrings- och incidentrutinen beskrivs operativt i
[`sakerhetsdrift-runbook.md`](sakerhetsdrift-runbook.md).

## Biträdes- och säkerhetskontroll

För varje leverantör som behandlar personuppgifter för Nova IT:s räkning ska ansvar, instruktioner, säkerhetsåtgärder, underbiträden, incidentrapportering, lagring och radering dokumenteras i avtal eller annan rättsakt. En tjänst får inte kopplas in i produktion innan den kontrollen är genomförd.

## Tredjelandsöverföringar

Kontrollera inför varje leverantörsändring om personuppgifter kan behandlas utanför EU/EES. Dokumentera överföringsgrund och kompletterande skyddsåtgärder i leverantörsbedömningen.

## Uppföljning

Registret ska ses över minst årligen och dessutom vid ny leverantör, nytt formulär, ny analys-/marknadsföringsteknik, ändrad lagringstid eller personuppgiftsincident.

> Arbetsdokument: juridisk och teknisk granskning krävs innan registret används som fullständig compliance-dokumentation.
