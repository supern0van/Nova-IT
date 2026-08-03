# Säkerhetsdrift och incidentrutin

Detta är Nova IT:s interna, praktiska runbook för tiden innan bolaget har en
separat säkerhetsfunktion. Den ska kunna följas av en person utan att börja
uppfinna processen mitt i en incident.

## Principer

- GitHub `main` är källan för kod och historik.
- Hemligheter får aldrig klistras in i chatt, ärenden, commit-meddelanden eller
  dokumentation.
- Vid osäkerhet: stoppa ny exponering först, bevara bevis sedan, åtgärda därefter.
- Radera inte loggar, databaser eller användare under pågående utredning om det
  inte behövs för att stoppa aktiv skada.
- Kommunicera hellre kort och sant än snabbt och spekulativt.

## Första timmen vid misstänkt incident

1. Skriv ned tidpunkt, upptäcktskälla och vad som observerats.
2. Klassificera preliminärt:
   - **P1:** aktivt intrång, läckt secret, publik exponering av kunddata eller
     obehörig åtkomst till admin/kundportal.
   - **P2:** misstänkt sårbarhet, missbruk, upprepade misslyckade inloggningar,
     felaktiga mail/SMS eller driftloggar med personuppgifter.
   - **P3:** hårdningspunkt utan känd exponering.
3. Stoppa fortsatt skada:
   - pausa berörd integration eller rotera berörd secret,
   - deploya rollback/revert om en ny release orsakar exponering,
   - höj Cloudflare-skydd/rate limiting om det är trafikkopplat.
4. Bevara bevis:
   - commit-SHA, Worker-version, tidsspann, berörda domäner,
   - GitHub PR/checks,
   - Cloudflare/Supabase/Resend/46elks-händelser om tillgängligt.
5. Bedöm personuppgifter:
   - vilka kategorier av uppgifter,
   - ungefär hur många personer,
   - om uppgifterna faktiskt lästs/laddats ned eller bara var tekniskt möjliga
     att nå.
6. Om personuppgifter kan vara berörda: gör en skriftlig bedömning samma dag om
   anmälan till IMY eller information till registrerade behövs. Ta extern hjälp
   om bedömningen är oklar.

## Rollback och återställning

### Kod

1. Identifiera senast fungerande commit:
   ```bash
   git log --oneline --decorate -20
   ```
2. Använd revert-commit, inte force-push:
   ```bash
   git revert <commit-sha>
   git push
   ```
3. Låt CI gå grönt och deploya berörd Worker.
4. Verifiera live:
   - publik webbplats: `https://nova-it.se/`
   - admin: `https://admin.nova-it.se/logga-in`
   - kundportal: `https://kundportal.nova-it.se/logga-in`
   - skyddade API:er ska neka oinloggad/obehörig trafik.

### Supabase

1. Använd Supabase Dashboard för Point-in-Time Recovery eller backup enligt
   aktuell plan.
2. Återställ aldrig direkt över produktion utan att först veta:
   - vilken tidpunkt som är ren,
   - vilka ärenden/kundposter som kan försvinna,
   - om efterföljande mail/SMS redan har skickats.
3. Efter restore: kontrollera RLS/grants, service-role-flöden och minst ett
   läs-/skrivflöde i admin och kundportal.

## Nyckelrotation

Rotera alltid en secret om den kan ha visats i terminal, chatt, logg, screenshot,
PR, deployment output eller tredjepartsverktyg.

### Cloudflare Worker-secrets

Sätt nya värden utan att skriva ut dem:

```bash
wrangler secret put SECRET_NAMN --name worker-namn
```

Verifiera bara namn, aldrig värden:

```bash
wrangler secret list --name worker-namn
```

Efter rotation:

- deploya eller trigga om Workern om integrationen kräver ny runtime,
- kör smoke-test mot berörd domän,
- notera datum, secret-namn och orsak i internt incidentunderlag.

### Supabase

1. Rotera service-role eller publishable key i Supabase Dashboard.
2. Uppdatera berörda Worker-secrets:
   - admin: `nova-it-admin`
   - kundportal: `nova-it-kundportal`
   - publik site om den använder nyckeln i framtiden.
3. Kör:
   - `portal`: `pnpm worker:secrets:check`
   - live-login/admin smoke,
   - kundportal login smoke.

### Resend och 46elks

1. Skapa ny API-nyckel hos leverantören med minsta möjliga behörighet.
2. Lägg in nyckeln som Worker-secret.
3. Skicka ett kontrollerat test till egen adress/eget nummer.
4. Återkalla den gamla nyckeln när testet är verifierat.

## Gallring och minimering

Tills annat dokumenterat beslut tas gäller:

| Data                                             | Huvudregel                                                                                                           |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Kontaktförfrågningar som inte leder till uppdrag | gallras senast 12 månader efter senaste kontakt                                                                      |
| Ärenden och kundkommunikation                    | sparas så länge kundrelation, garanti, bokförings-/avtalsbehov eller supporthistorik motiverar det; årlig genomgång  |
| Kundportalkonto utan aktiv relation              | spärras eller raderas vid avslutad kundrelation eller på begäran när lag/avtal tillåter                              |
| Tillfälliga lösenord                             | ska bara finnas i engångsmejl/flöde och aldrig loggas eller visas i admin efter skapande                             |
| Drift- och säkerhetsloggar                       | behålls enligt leverantörernas inställningar och bara så länge de behövs för drift, felsökning och incidenthantering |
| Lokala testdata och exporter                     | raderas när testet är klart; får inte innehålla riktiga kunduppgifter utan särskilt beslut                           |

## Månatlig egenkontroll

Kör eller kontrollera:

```bash
git status -sb
gh api repos/supern0van/Nova-IT/dependabot/alerts --jq '[.[] | select(.state=="open")] | length'
bun run audit:cloudflare-live
```

Kontrollera dessutom manuellt:

- GitHub branch protection och secret scanning är fortsatt aktiva.
- Cloudflare WAF/rate limit-regler finns kvar.
- DNS-handoff i `docs/email-dns-handoff.md` är åtgärdad eller fortfarande känd.
- Supabase-projektens tabeller har inte fått `anon`/`authenticated`-grants av misstag.
- Senaste deployade Worker-version motsvarar avsedd `main`-commit.

## Incidentloggmall

Kopiera detta till ett privat internt underlag vid incident:

```text
Datum/tid:
Upptäckt av:
Berörd tjänst:
Klassning: P1 / P2 / P3
Kort beskrivning:
Första åtgärd:
Berörda personuppgifter:
Berörda externa leverantörer:
Commit/Worker-version:
Beslut om IMY/kundinformation:
Slutlig åtgärd:
Förebyggande uppföljning:
```
