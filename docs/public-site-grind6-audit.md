# Grind 6: tillgänglighet, SEO, prestanda och slutlig QA

Status: grundad genomgång baserad på faktisk kodläsning och verifiering i webbläsare (build,
typecheck, lint, test, samt kontrastmätning och breakpoint-kontroll i en körande preview).

## Åtgärdat i detta pass

### SEO

1. **Fyra sidor saknade canonical-länk och sidspecifik OG/Twitter-metadata**:
   `/arbetssatt`, `/assistent`, `/projekt-aterbruk` och `/tjanster` hade bara `title` +
   `description` i sin `head()`. Utan `og:title`/`og:description`/`og:url` visar en delning på
   sociala medier startsidans generiska text i stället för sidans egen, och utan `canonical`
   saknas den explicita signalen om vilken URL som är den kanoniska. Tillagt för samtliga fyra,
   enligt samma mönster som redan användes på `/`, `/faq`, `/kontakt` och `/tjanster/$slug`.
   Verifierat live: `document.querySelector('link[rel="canonical"]')` och `meta[property="og:title"]`
   ger nu rätt, sidspecifikt värde på alla fyra sidorna.
2. **`/assistent` saknades helt i `public/sitemap.xml`.** Sidan har egna metadata och är avsedd
   att vara en delningsbar, SEO-vänlig ingång (se Grind 1, fynd 2), men söktjänster fick aldrig
   reda på att den finns. Tillagd.
3. **`/assistent` hade ingen länk från global navigation eller sidfot.** Tillagd i sidfotens
   "Information"-kolumn ("Förbered ditt ärende"). Verifierat i webbläsare att länken renderas
   och pekar rätt.

### Tillgänglighet (kontrast, WCAG 2.1 AA)

4. **Sidfotens copyright-rad och juridiska länkar (`Integritet`/`Kakor`/`Webbplatsvillkor`)
   hade för låg kontrast.** `text-slate-500` mot den faktiska bakgrunden (footerns
   `#111c25` med ett `bg-black/10`-lager ovanpå) gav **3.72:1** — under AA-kravet på 4.5:1 för
   normal textstorlek (`text-xs` räknas inte som "stor text"). Mätt med faktisk
   canvas-baserad färgkonvertering i webbläsaren (Tailwind v4 använder `oklch`/`oklab`
   internt, så en enkel CSS-variabelavläsning hade gett fel resultat). Ändrat till
   `text-slate-400`, som mätte **6.74:1** på samma plats efter fix.
5. **Samma mönster i kontaktformulärets guidekort** (`kontakt.tsx`, textraden för
   `assistantContext.guidance`) och i **supportassistentens sammanfattning av gjorda val**
   (`SupportGuide.tsx`, etiketten "Dina val i ordning" och radnumreringen `1.`/`2.` etc.) —
   samma för låga `text-slate-500`/`text-slate-600` mot mörk bakgrund. Båda ändrade till
   `text-slate-400`, konsekvent med fixen ovan.
6. Övriga träffar på `text-slate-500`/`600` (i `cookie-consent.tsx`, `legal-dialog.tsx`) ligger
   på ljusa bakgrunder (`bg-slate-50`/vit dialogruta) där samma färg ger god kontrast — inga
   ändringar gjorda där, verifierat att bakgrunden faktiskt skiljer sig innan de lämnades orörda.

Alla övriga stickprov (`text-slate-300`, `text-slate-400`, länkar i huvudnavigationen) mätte
6.5–13:1 mot sina respektive bakgrunder — god marginal, inga fler fynd i denna kategori.

## Verifierat, inga ändringar behövda

- **Alla `<img>`-element har `alt`-text.** Två träffar i koden (`index.tsx`, `projekt-aterbruk.tsx`),
  båda med beskrivande, korrekt `alt`.
- **Rubrikhierarki**: varje sida renderar exakt en `<h1>` i taget. `kontakt.tsx` har tre
  `<h1>`-förekomster i källkoden, men de hör till tre ömsesidigt uteslutande villkorliga
  vyer (informationsvy, granskningsvy, bekräftelsevy) — aldrig mer än en i DOM:en samtidigt.
- **Ingen horisontell overflow** vid 375px, 768px eller 1440px (kontrollerat med
  `document.documentElement.scrollWidth` vs `clientWidth` på startsidan).
- **Inga webbfonter laddas.** Sajten använder systemtypsnitt (ingen `@font-face`/Google Fonts-länk
  hittad) — inget FOUT/FOIT-problem, en extra nätverksbegäran mindre på varje sidladdning.
- **Konsolen visar inga nya fel** efter ändringarna, bara det sedan tidigare kända och
  ofarliga `data-tsd-source`-hydreringsfelet (Lovables dev-instrumentation, bekräftat frånvarande
  i produktionsbygget `.output/`).

## Åtgärdat i uppföljningspasset

7. **Hero-bilden och `projekt-aterbruk`-bilden komprimerade till WebP.**
   `public/nova-it-workspace.png` (1,57 MB) → `nova-it-workspace.webp` (56 KB, 96 % mindre) och
   `presentation-cover.png` (957 KB) → `presentation-cover.webp` (70 KB, 93 % mindre), båda
   genererade med `bunx sharp-cli -f webp -q 78` (körs via `bunx`, inget nytt beroende
   tillagt i `package.json`/lockfilen - verifierat med `git diff --stat -- package.json
   bun.lock`, ingen ändring). Originalen behålls oförändrade som fallback: båda bilderna
   använder nu `<picture><source type="image/webp">` + `<img src=".png">`, så webbläsare utan
   WebP-stöd (finns i praktiken inte kvar, men kostar inget att behålla) fortfarande fungerar.
   Kvalitet visuellt granskad före byte (läst in båda WebP-filerna som bilder) - ingen synlig
   artefakt, text i presentationsbilden fortsatt skarp. Verifierat live: hero-bildens
   `img.currentSrc` pekar på `.webp`, korrekt renderad storlek (1425×760 mot samma sektion som
   innan), och ett direkt `fetch()` av `/projekt-aterbruk/presentation-cover.webp` gav `200` med
   `content-type: image/webp` och exakt förväntad filstorlek.
8. **`/tjanster` säger "Tre områden" i rubriken** — kontrollerat mot `serviceAreas` i
   `lib/nova-data.ts`: exakt tre poster. Stämmer, inget fel - fyndet från Grind 1 är stängt.

## Åtgärdat i tredje uppföljningen

9. **Faktisk fältmätning körd med Lighthouse CLI (`npx lighthouse`) mot skarpa `nova-it.se`**,
   mobil-emulering med standardthrottling (samma som PageSpeed Insights använder):

   | Sida | Prestanda | Tillgänglighet | Best Practices | SEO | LCP | CLS | TBT |
   | --- | --- | --- | --- | --- | --- | --- | --- |
   | `/` | 93 | 100 | 100 | 100 | 2,7 s | 0 | 10 ms |
   | `/kontakt?form=request` | 82 → 92 (andra körningen) | 100 | 100 | 100 | 3,7 s → 2,7 s | 0 | 50 ms |

   Den första `/kontakt`-körningen (82, LCP 3,7 s) var kallstartsbrus - en andra körning gav
   92 och LCP 2,7 s, i linje med startsidan. `/kontakt` har `unused-javascript` på ~86 KiB
   (sannolikt Radix-komponenter som inte alla används på just den sidan) - en möjlig framtida
   optimering, men inte tillräckligt stort för att prioritera nu givet att prestandan redan är
   god. Accessibility, Best Practices och SEO är 100/100 på båda sidorna - inga kvarvarande
   fynd i de kategorierna. CLS är 0 på båda, vilket bekräftar att bild- och layoutändringarna
   i detta pass inte introducerat något layoutskift.

## Kvarstående, inte åtgärdat

10. **Skärmläsarbeteende i praktiken** (NVDA/VoiceOver) är inte testat — kräver en riktig
    skärmläsare, inte bara DOM-/kontrastanalys eller Lighthouses automatiserade a11y-revision
    (som redan ger 100/100, men det täcker inte allt en riktig skärmläsare skulle avslöja).
    Tangentbordsfokusordning i kontaktformuläret är dock redan verifierad tidigare (Grind 4):
    tomt formulär flyttar fokus till första ogiltiga fält och visar `role="alert"` per fält.

## Kvalitetsgrindar

`bun run ci` (test + lint + typecheck + build) grönt efter samtliga ändringar i detta pass.
Lighthouse körd direkt mot produktion (`nova-it.se`) efter deploy, se tabellen ovan.

## Uppföljning 2026-08-23: kodnära SEO redan klar, kvar är off-page

Genomgång av `src/lib/structured-data.ts` bekräftar att `LocalBusiness`
(`ProfessionalService`), `WebSite`, `Service` per tjänstesida, `FAQPage` och
`BreadcrumbList` redan finns som strukturerad data, och Lighthouse SEO är
100/100 (se tabellen ovan) - det finns inget uppenbart kodnära SEO-fynd kvar
att åtgärda i det här repot just nu.

11. **`/assistent` togs bort ur `public/sitemap.xml`** (NOVA-0062) - sidan har
    haft `noindex, follow` sedan assistenten stängdes av (NOVA-0061), men
    stod ändå kvar i sitemapen, en motsägande signal till sökmotorer. Läggs
    tillbaka när assistenten är i drift igen.
12. **Inga `sameAs`-länkar i `LocalBusiness`-schemat.** Det finns inga
    sociala profiler eller en Google Business-profil kopplade i koden
    (verifierat: ingen träff på facebook/instagram/linkedin/sameAs i `src/`).
    Det här är inte en kodbugg utan en verksamhetsfråga: en **Google
    Business-profil** (Google Maps-listning) är sannolikt den enskilt
    starkaste kvarvarande lokala SEO-åtgärden för en Hässelby/Västerort-
    baserad enskild firma - troligen större effekt än ytterligare
    kodändringar, eftersom den ger synlighet i Google Maps och det lokala
    sökresultat-paketet. Kräver en verksamhetsåtgärd (skapa/verifiera
    profilen) snarare än kod; när den finns läggs adressen/profil-URL:en in
    som `sameAs` i `buildLocalBusinessJsonLd()`.
