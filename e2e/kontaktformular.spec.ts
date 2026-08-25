import { test, expect, type Page, type Route } from "@playwright/test";

/**
 * E2E-täckning för kontaktformuläret + ärendeguiden (den strukturerade
 * intag-vyn på /kontakt?form=request - plain /kontakt visar bara statiska
 * kontaktuppgifter, se ContactInformation() i src/routes/kontakt.tsx).
 *
 * Turnstile körs mot Cloudflares riktiga tjänst med en officiell testnyckel
 * (se playwright.config.ts) - ingen mockning av själva Turnstile-flödet.
 * `submitContactRequest`-anropet (TanStack Starts server-fn, POST till
 * `/_serverFn/<base64(json)>` där json = {file, export}) mockas DÄREMOT
 * medvetet - testerna ska aldrig skapa riktiga ärenden i adminportalen.
 */

const KONTAKT_URL = "/kontakt?form=request";

async function acceptCookies(page: Page) {
  const knapp = page.getByRole("button", { name: "Godkänn alla" });
  if (await knapp.isVisible().catch(() => false)) {
    await knapp.click();
  }
}

/**
 * Sidan är server-renderad - knapparna/comboboxarna finns i DOM:en (och
 * går att "klicka" på) LÅNGT innan React faktiskt hunnit hydrera och
 * fästa sina händelselyssnare. Ett klick före det landar på ett dött
 * element: inget händer, ingen synlig felindikation, bara tyst
 * ingenting - vilket i praktiken bara syntes som att Select-listor aldrig
 * öppnades och att formulärets submit-hanterare aldrig kördes
 * (upptäckt genom att en explicit väntan löste exakt de två symptomen).
 * `networkidle` täcker att alla JS-paket hunnit laddas ner; den extra
 * marginalen täcker Reacts hydrerings-commit, som ligger ett kort steg
 * EFTER att sista skriptet svarat klart.
 */
async function waitForHydration(page: Page) {
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("button", { name: "Visa ärendesammanfattning" })
    .waitFor({ state: "visible" });
  await page.waitForTimeout(500);
}

async function fillValidForm(page: Page) {
  await page.getByLabel("Namn").fill("Test Testsson");
  await page.getByLabel("E-post").fill("test@example.com");

  await page.getByRole("combobox", { name: "Kundtyp" }).click();
  await page.getByRole("option", { name: "Privatperson" }).click();

  await page.getByRole("combobox", { name: "Tjänst" }).click();
  await page.getByRole("option").first().click();

  await page.getByRole("combobox", { name: "När behöver du hjälp?" }).click();
  await page.getByRole("option", { name: "Normal", exact: true }).click();

  await page
    .getByLabel(/Beskriv ärendet|Din beskrivning/)
    .fill("Det här är en testbeskrivning med minst tio tecken.");

  await page.getByLabel(/Jag har tagit del av informationen/).check();
}

/** Identifierar `submitContactRequest`-anropet bland alla `/_serverFn/*`-
 *  requests genom att avkoda base64url-nyttolasten - robust mot att andra
 *  server-funktioner (t.ex. getTurnstileSiteKey, getIntagLage) laddas på
 *  samma sida utan att behöva mockas. */
function arSubmitContactRequest(route: Route): boolean {
  const url = route.request().url();
  const marker = url.split("/_serverFn/")[1]?.split("?")[0] ?? "";
  try {
    const decoded = Buffer.from(marker, "base64url").toString("utf8");
    return decoded.includes("submitContactRequest");
  } catch {
    return false;
  }
}

test.describe("Kontaktformuläret (/kontakt?form=request)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(KONTAKT_URL);
    await acceptCookies(page);
    await waitForHydration(page);
  });

  test("visar valideringsfel om obligatoriska fält saknas", async ({ page }) => {
    await page.getByRole("button", { name: "Visa ärendesammanfattning" }).click();
    await expect(page.getByText(/Granska \d+ fält innan du går vidare\./)).toBeVisible();
  });

  test("honeypot-fältet är dolt för en människa (fynd P1, regressionstest)", async ({ page }) => {
    const honeypot = page.locator("#website");
    await expect(honeypot).toHaveAttribute("aria-hidden", "true");
    await expect(honeypot).toHaveAttribute("tabindex", "-1");
    const label = page.locator('label[for="website"]');
    await expect(label).toHaveAttribute("aria-hidden", "true");
  });

  test("visar en korrekt ärendesammanfattning innan inskick", async ({ page }) => {
    await fillValidForm(page);
    await page.getByRole("button", { name: "Visa ärendesammanfattning" }).click();

    await expect(page.getByRole("heading", { name: "Granska innan du skickar" })).toBeVisible();
    await expect(page.getByText("Normal", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Det här är en testbeskrivning med minst tio tecken."),
    ).toBeVisible();
  });

  test("'Ändra uppgifter' tar tillbaka till formuläret med värdena kvar", async ({ page }) => {
    await fillValidForm(page);
    await page.getByRole("button", { name: "Visa ärendesammanfattning" }).click();
    await page.getByRole("button", { name: "Ändra uppgifter" }).click();

    await expect(page.getByLabel("Namn")).toHaveValue("Test Testsson");
    await expect(page.getByLabel("E-post")).toHaveValue("test@example.com");
  });

  test("begär en NY Turnstile-token efter ett misslyckat inskick i stället för att återanvända den förbrukade (regressionstest, granskning 2026-08-25 #1)", async ({
    page,
  }) => {
    let anrop = 0;
    await page.route("**/_serverFn/**", async (route) => {
      if (!arSubmitContactRequest(route)) return route.continue();
      anrop += 1;
      await route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
    });

    await fillValidForm(page);
    await page.getByRole("button", { name: "Visa ärendesammanfattning" }).click();

    const skickaKnapp = page.getByRole("button", { name: /Skicka ärendet|Verifierar|Skickar/ });
    // Turnstiles testnyckel utfärdar en riktig token mot Cloudflares tjänst -
    // inget att mocka, bara att vänta in (nätverksberoende, generöst tak).
    await expect(skickaKnapp).toHaveText("Skicka ärendet", { timeout: 15_000 });
    await skickaKnapp.click();

    await expect(page.getByRole("alert").filter({ hasText: "kunde inte skickas" })).toBeVisible();

    // Kärnan i regressionen: FÖRE fixen förblev turnstileToken oförändrat
    // efter ett fel, så knappen visade omedelbart "Skicka ärendet" igen (och
    // ett omförsök skickade med samma redan förbrukade token, garanterat
    // dömt att misslyckas). Efter fixen ska knappen tillfälligt visa
    // "Verifierar..." medan en FÄRSK token hämtas.
    await expect(skickaKnapp).toHaveText("Verifierar...");
    await expect(skickaKnapp).toHaveText("Skicka ärendet", { timeout: 15_000 });

    await skickaKnapp.click();
    await expect.poll(() => anrop).toBe(2);
  });
});
