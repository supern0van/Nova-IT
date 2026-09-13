import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automatiserat tillgänglighetssvep (WCAG 2.0/2.1 A + AA) över de publika
 * sidorna, med axe-core. Körs i samma E2E-flöde som övriga specs
 * (`.github/workflows/e2e.yml` - push till main + nattlig cron), inte i
 * PR-loopen, av samma skäl som resten av e2e/: se playwright.config.ts.
 *
 * Detta ersätter INTE en manuell/skärmläsarbaserad granskning - axe-core
 * fångar ungefär en tredjedel av verkliga WCAG-brister (kontrast, saknad
 * alt-text, felaktig ARIA, formulär utan label, m.m.), men de bristerna är
 * de vanligaste och billigaste att råka introducera i en vanlig PR, så ett
 * automatiserat golv här fångar regressioner tidigt utan att ersätta
 * `docs/project-status.md`s plan för regelbundna manuella kontroller.
 *
 * Varje sida testas i sitt "vilande" tillstånd (ingen interaktion) - dolda
 * paneler/dialoger som bara syns efter en användarhandling täcks inte här;
 * lägg till en egen `test(...)` med motsvarande interaktion om en sådan
 * yta blir tillräckligt komplex för att motivera det.
 */

const SIDOR = [
  { namn: "Startsida", path: "/" },
  { namn: "Tjänster", path: "/tjanster" },
  { namn: "Privatpersoner", path: "/privatpersoner" },
  { namn: "Företag & föreningar", path: "/foretag-foreningar" },
  { namn: "Arbetssätt", path: "/arbetssatt" },
  { namn: "Om oss", path: "/om-oss" },
  { namn: "FAQ", path: "/faq" },
  { namn: "Kontakt", path: "/kontakt" },
  { namn: "Ärendeguiden", path: "/kontakt?form=request" },
  { namn: "Ärendestatus", path: "/arendestatus" },
  { namn: "Projekt & återbruk", path: "/projekt-aterbruk" },
] as const;

for (const sida of SIDOR) {
  test(`${sida.namn} (${sida.path}) har inga axe-core WCAG A/AA-fynd`, async ({ page }) => {
    await page.goto(sida.path);
    // Cookiebannern (role="region", se cookie-consent.tsx) ligger ovanpå
    // sidan tills den besvaras - lämna den obesvarad avsiktligt så den
    // egna tillgängligheten (fokus, aria-live, kontrast) också täcks av
    // svepet nedan, i stället för att döljas genom att klicka bort den.
    await page.waitForLoadState("networkidle");

    const resultat = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      resultat.violations,
      resultat.violations
        .map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} förekomst(er)`)
        .join("\n"),
    ).toEqual([]);
  });
}
