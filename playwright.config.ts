import { defineConfig, devices } from "@playwright/test";

/**
 * E2E-täckning för publika sajten (Fas P6-E2E, se plan).
 *
 * Körs INTE på varje PR - bara på push till main och en nattlig
 * schemalagd körning (`.github/workflows/e2e.yml`), ett medvetet val för
 * att hålla PR-feedback-loopen snabb (bun test/lint/typecheck/build körs
 * fortfarande på varje PR som vanligt, se ci.yml). Kör lokalt med
 * `bun run e2e`.
 *
 * Turnstile testas mot Cloudflares officiella, dokumenterade test-nycklar
 * (https://developers.cloudflare.com/turnstile/troubleshooting/testing/) -
 * `1x00000000000000000000AA` renderar en riktig widget som ALLTID
 * utfärdar en giltig token, mot Cloudflares riktiga tjänst (kräver
 * nätverksåtkomst till challenges.cloudflare.com, precis som CI-miljön
 * redan har). Ingen mockning av Turnstile behövs eller görs - det är
 * poängen med test-nycklarna.
 */
const PORT = 4173;

export default defineConfig({
  testDir: "./e2e",
  // workers: 1 (inte fullyParallel) - vite dev svarar 503 ("Vite
  // environment 'nitro' is unavailable") i några sekunder EFTER att porten
  // redan tar emot TCP-anslutningar, medan Nitro-miljön fortfarande värms
  // upp lat. webServer-hälsokontrollen nedan ser bara att porten svarar,
  // inte att SSR-hanteraren är redo - flera parallella workers som alla gör
  // sin FÖRSTA request samtidigt (t=0) kunde då träffa fönstret och få fel
  // sida/fel. Ett enda worker-flöde eliminerar kapplöpningen helt; testerna
  // körs ändå bara nattligt/vid push till main, inte i PR-loopen, så den
  // något längre väggklockstiden kostar inget i praktiken.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `bun run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      // Cloudflares officiella "alltid giltig"-testnyckel - se filkommentaren.
      TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      // Lämnas medvetet OSATTA: ADMIN_INTAKE_URL/INTAG_SECRET. Testerna ska
      // aldrig skapa riktiga ärenden i produktionens adminportal - utan dem
      // faller skickaKontaktforfragan() stängt (samma beteende som
      // contact-server.test.ts:s "fails closed"-test verifierar), och
      // testerna som behöver ett LYCKAT inskick mockar nätverksanropet
      // direkt via page.route() i stället.
    },
  },
});
