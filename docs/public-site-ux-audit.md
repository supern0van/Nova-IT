# Publika webbplatsens UX-revision (Grind 1)

Status: **grundad genomgång av samtliga routes och navigationsstruktur**, baserad på faktisk
kodläsning (inte antaganden). Djupare sida-för-sida-granskning mot samtliga 15 kriterier per
sida (visuell hierarki, kontrast, mobilbrytpunkter etc.) återstår och fortsätter i senare pass —
det som listas här är verifierade, konkreta fynd, inte en fullständig poängsatt katalog.

## Vad som redan fungerar väl och ska bevaras

- Custom 404-sida och felgräns finns redan i `__root.tsx` (`NotFoundComponent`,
  `ErrorComponent`) — bättre skick än förväntat, ingen risk för trasiga 404-vägar idag.
- Skip-to-content-länk, `lang="sv"`, fullständig canonical/OG/Twitter-metadata på varje sida
  som har egen `head()`.
- Startsidan har redan en tydlig, i huvudsak korrekt struktur: hjälte med en primär och en
  sekundär CTA, tydlig målgruppsuppdelning (privat/verksamhet), tjänsteteaser med länk vidare,
  arbetssättssteg.
- Samtliga sju efterfrågade tjänste-slugs (`it-support`, `natverk`, `datorinstallation`,
  `felsokning`, `sakerhet-backup`, `microsoft-google`, `datorservice`) finns i
  `lib/nova-data.ts` och renderas korrekt via `tjanster.$slug.tsx` — inga trasiga
  tjänstelänkar hittade.
- Serviceområdets text (`lib/service-region.ts`) är redan professionell och innehåller inga
  formuleringar om kollektivtrafik.
- `docs/project-status.md` visar att kvalitetsgrindarna (`bun run test/typecheck/build`)
  redan är gröna före detta pass.

## Kritiska problem

1. **Ingen lokal ärendedatabas.** Bekräftat i `docs/project-status.md`: kontaktformuläret
   skickar bara e-post via Resend — det finns inget lagringslager. Ett misslyckat mejl idag
   betyder att förfrågan inte finns registrerad någonstans. Detta är den centrala
   arkitekturbristen som Grind 5 ska åtgärda (kopplat ärendeintag mot adminportalens
   `admin_kunder`/`admin_arenden`).
2. **Den fristående `/assistent`-sidan saknar intern länk.** Själva assistentupplevelsen
   (`SupportGuide`) är nåbar överallt via den flytande "Förbered ärende"-knappen
   (`SupportBotLauncher`, döljer bara sig själv på `/assistent` för att undvika dubblett) —
   detta är INTE en total återvändsgränd som ursprungligen noterat. Men den dedikerade,
   SEO-vänliga sidan `/assistent` (egen URL, egna metadata, delningsbar länk) har ingen
   länk från header, footer eller startsida. Värt att lägga till en direktlänk dit, lägre
   prioritet än ursprungligen bedömt.
3. **Turnstile/spamskydd saknas**, bekräftat i `docs/project-status.md`s egen att-göra-lista
   — kontaktformuläret är exponerat utan botskydd.

## Viktiga problem

4. ✅ **ÅTGÄRDAT** — Huvudnavigationen länkade inte till målgruppssidorna. `/privatpersoner`
   och `/foretag-foreningar` tillagda i `nav`-arrayen (`site-chrome.tsx`), verifierat i
   webbläsare utan overflow ner till 1024px.
5. **`/tjanster/datorservice` är en föräldralös sida.** `tjanster.tsx` filtrerar uttryckligen
   bort `datorservice`-tjänsten från katalogen (`services.filter(s => s.slug !==
   "datorservice")`), men routen och innehållet finns kvar och är fullt nåbar via direkt URL.
   Oklart om detta är avsiktligt (utfasad tjänst?) eller ett förbiseende — bör beslutas innan
   Grind 3.
6. ✅ **ÅTGÄRDAT** — `/arbetssatt` saknade avslutande CTA. Tillagd, verifierat i webbläsare
   att länken pekar till `/kontakt?form=request`.
6b. ✅ **DELVIS ÅTGÄRDAT** — `/projekt-aterbruk` dubblerade redan existerande delade
   CSS-klasser (`nova-section` = `#0d151e`, `nova-section-muted` = `#101922`) som rå
   hex-värden inline i stället för att återanvända dem, samtidigt som sidan har nio separata
   `<section>`-block med bakgrundsskiften och linjer mellan nästan varje — precis den
   "fristående kampanjsida"-känsla uppdragsbeskrivningen själv pekar ut som ett problem.
   Klassdubbleringen är nu konsoliderad (verifierat pixel-identiska bakgrundsvärden i
   webbläsaren, ingen visuell ändring). Den större frågan — att slå ihop/minska antalet
   sektioner och knyta innehållet tydligare till Nova IT:s kompetens — är en genuin
   omdesignuppgift som kräver visuell iteration, inte en säker enradsfix, och kvarstår som
   prioriterat Grind 3-arbete.
7. **Malltextmönster mellan `/privatpersoner` och `/foretag-foreningar`.** Strukturellt
   identiska sidor (rubrik + punktlista + ruta med serviceområde och en CTA) med bara
   innehållet utbytt. Fungerar, men ger begränsat djup — ingen sektion om "vad du behöver
   förbereda" eller relaterade tjänster, vilket uppdraget efterfrågar för målgruppssidorna.
8. **Serviceområdet nämner inte Järfälla/Jakobsberg, Sundbyberg eller Solna**, som
   uppdragsbeskrivningen listar som faktiska områden — `service-region.ts` täcker idag bara
   "Västerort, Bromma och Stockholms innerstad". Behöver stämmas av mot vad Nova IT faktiskt
   verkar i innan text uppdateras (uppdraget: "verifiera den slutliga listan mot befintligt
   innehåll och användarens aktuella beslut").

## Förbättringar (lägre prioritet)

9. Startsidan saknar egna sektioner för "Förtroendesignaler" och en avslutande CTA-sektion
   längst ner (nuvarande sista sektion är arbetssättsstegen, utan ny uppmaning efter dem) —
   uppdragets rekommenderade 9-punktsordning har fler steg än vad sidan har idag.
10. `/tjanster` säger "Tre områden" i rubriken — bör stämmas av mot faktisk kategoriindelning
    i `ServiceAreas`-komponenten (ej djupgranskad än) så texten inte blir missvisande om
    antalet ändras.

## Ej djupgranskat i detta pass — kräver fortsatt arbete

- `kontakt.tsx` (765 rader — kontaktformuläret) i detalj: fältstruktur, progressiv visning,
  validering, felmeddelanden.
- `om-oss.tsx`, `faq.tsx`, `projekt-aterbruk.tsx`, `assistent.tsx`: lästa översiktligt för
  navigationsfynd ovan, inte granskade mot samtliga 15 revisionskriterier.
- Faktisk mobil-rendering vid 375/768/1024/1440 px (kräver körande preview).
- Kontrast, tangentbordsfokusordning och skärmläsarbeteende i praktiken.
- Prestandamätning (LCP/CLS/INP).

## Prioriterad implementationsordning (förslag)

1. Bestäm `/tjanster/datorservice`: inkludera i katalogen igen, eller ta bort routen medvetet.
2. Lägg till CTA i navigationsraden till `/privatpersoner` och `/foretag-foreningar`, samt en
   synlig ingång till `/assistent` (t.ex. i header eller på startsidan bredvid
   "Beskriv ärende").
3. Lägg till avslutande CTA på `/arbetssatt`.
4. Fortsätt med Grind 2 (informationsarkitektur) och validera serviceområdeslistan innan
   text ändras på flera sidor samtidigt.
