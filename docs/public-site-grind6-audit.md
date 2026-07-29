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

## Kvarstående fynd — inte åtgärdade i detta pass

7. **Hero-bilden (`public/nova-it-workspace.png`, 1,57 MB) och `projekt-aterbruk`-bilden
   (`presentation-cover.png`, 957 KB) är stora, okomprimerade PNG:er.** Hero-bilden är sidans
   LCP-element (`fetchPriority="high"` är redan satt, vilket är rätt) men själva filstorleken
   påverkar sannolikt LCP negativt på mobil/svagare uppkoppling. Åtgärdades inte i detta pass:
   ingen bildkomprimeringsverktyg (`sharp`, `cwebp`, `imagemagick`) finns tillgängligt i den
   här miljön, och att införa ett nytt npm-beroende enbart för detta är ett beslut som bör tas
   separat snarare än göras i förbigående. Rekommendation: komprimera båda till WebP eller en
   optimerad PNG (t.ex. via `squoosh.app` eller `bunx @squoosh/cli`) innan bred lansering,
   sikta på under ~200 KB för hero-bilden.
8. **Faktisk fältmätning (Lighthouse/PageSpeed Insights, LCP/CLS/INP i skarp miljö)** har inte
   körts — kräver en publikt nåbar URL eller ett verktyg som inte finns i den här miljön.
   Rekommenderas som ett manuellt steg efter nästa produktionsdeploy.
9. **Skärmläsarbeteende i praktiken** (NVDA/VoiceOver) är inte testat — kräver en riktig
   skärmläsare, inte bara DOM-/kontrastanalys. Tangentbordsfokusordning i kontaktformuläret är
   dock redan verifierad tidigare (Grind 4): tomt formulär flyttar fokus till första ogiltiga
   fält och visar `role="alert"` per fält.
10. **`/tjanster` säger "Tre områden" i rubriken** (Grind 1, fynd 10) — inte stämt av mot
    faktisk kategoriindelning i detta pass, kvarstår som öppet fynd.

## Kvalitetsgrindar

`bun run ci` (test + lint + typecheck + build) grönt efter samtliga ändringar i detta pass.
