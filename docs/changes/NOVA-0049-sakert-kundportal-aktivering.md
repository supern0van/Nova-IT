---
id: NOVA-0049
date: 2026-08-19
date_precision: day
type: security
status: completed
systems:
  - publik-webbplats
  - kundportal
  - adminportal
---

# Ersätt tillfälligt kundportalslösenord med säker aktiveringslänk

## Vad ändrades?

Kontaktbekräftelsemejlet som skickas via `contact-server.ts`/
`contact-submission.ts` (`formatCustomerConfirmationEmail`) innehåller inte
längre ett kundportalslösenord i klartext. När ett nytt kundportalskonto
skapas åt en kund (via kontaktformuläret eller en eskalerad supportchatt)
innehåller mejlet i stället en tidsbegränsad, engångsanvändbar
aktiveringslänk (`aktiveringslank`), genererad av Supabase Auths egen
`generateLink({ type: "invite" })` i kundportalrepot. Kunden väljer sitt
eget lösenord först på kundportalens nya `/aktivera-konto`-sida.

Samma ändring gäller genomgående i adminportalen (manuellt skapad kund,
manuellt registrerat ärende, och den explicita "Skicka nya
inloggningsuppgifter"-åtgärden) - alla fyra ställen som tidigare kunde
skicka ett tillfälligt lösenord skickar nu bara en länk.

## Varför?

En oberoende GDPR-/säkerhetsgranskning (19 augusti 2026) identifierade att
en autentiseringshemlighet (ett `crypto.getRandomValues`-genererat
tillfälligt lösenord) passerade oskyddad genom flera tjänster
(kundportal → adminportal → publika sajten → Resend) och landade i
klartext i en transaktionell e-post - en onödig risk för en hemlighet som
en angripare med tillgång till någon länk i den kedjan (eller till
kundens inkorg efteråt) kunde återanvända direkt för att logga in.

Lösningen använder Supabase Auths egen, redan vältestade
`generateLink`-mekanism i stället för att uppfinna ett eget
lösenordssystem - samma mekanism som appens självbetjänade
"glömt lösenord" redan förlitar sig på för recovery-länkar.

## Resultat

- Inget lösenord genereras av vår kod, returneras mellan Workers,
  loggas eller skickas via e-post någonstans i kedjan längre.
- 298 (kundportal) + 663 (adminportal) tester gröna i
  `Nova-IT-Portaler`-repot, typecheck/lint/produktionsbygge gröna i båda
  apparna. 133 tester gröna i denna repo (`bun test`), typecheck och lint
  rena, produktionsbygge verifierat.
- Ingen ändring i AI-chattens logik, Workers AI-integrationen eller
  eskaleringsflödets transkriptbegränsningar - bara vad som händer med
  kontoskapandet i slutet av det flödet.

## Dokumentationspåverkan

`docs/register-over-behandlingar.md`, `docs/kundportal-planering.md` och
`docs/kundportal-arbetsorder.md` uppdaterade för att spegla den nya
mekanismen. Nova IT:s separata GDPR-/AI-dokumentationspaket (10 sakdokument
+ granskningsrapport) påverkas också - se den separata konsekvensrapporten
som levererades tillsammans med denna kodändring; dokumenten i paketet
ändras i ett senare, separat steg (v1.4.1) enligt uppdragets egen
arbetsordning.
