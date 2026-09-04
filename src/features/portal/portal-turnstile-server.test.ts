import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import {
  KUNDPORTAL_TURNSTILE_CONFIG_URL,
  hamtaKundportalTurnstileSiteKey,
  lasKundportalTurnstileSiteKey,
} from "./portal-turnstile-server";
import { KUNDPORTAL_ORIGIN } from "../../lib/security-policy";

describe("kundportal Turnstile-konfiguration", () => {
  it("hamtar portalinloggningens site key fran kundportalens publika config", () => {
    expect(KUNDPORTAL_TURNSTILE_CONFIG_URL).toBe(
      `${KUNDPORTAL_ORIGIN}/api/public/turnstile-config`,
    );
  });

  it("laser en giltig publik site key fran kundportalens svar", () => {
    expect(lasKundportalTurnstileSiteKey({ siteKey: " 0x4-test " })).toBe("0x4-test");
  });

  it("ignorerar saknade eller tomma site keys", () => {
    expect(lasKundportalTurnstileSiteKey({ siteKey: "" })).toBeNull();
    expect(lasKundportalTurnstileSiteKey({ siteKey: null })).toBeNull();
    expect(lasKundportalTurnstileSiteKey(null)).toBeNull();
  });
});

describe("getKundportalTurnstileSiteKey - cache (Runda 3-fynd #7)", () => {
  let originalFetch: typeof fetch;
  let anrop: number;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    anrop = 0;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // Ordningen mellan de här två testerna spelar roll: cachen lever på
  // modulnivå (precis som i produktion, ett Worker-isolat) och nollställs
  // INTE mellan testerna i den här filen. Det misslyckade-anropet-testet
  // körs därför FÖRST, innan något lyckat svar hunnit cachas - annars
  // skulle det bara se det tidigare testets cachade site key.
  it("cachar INTE ett misslyckat anrop - nästa öppning försöker på nytt direkt", async () => {
    globalThis.fetch = (async () => {
      anrop += 1;
      return new Response(null, { status: 502 });
    }) as unknown as typeof fetch;

    const forsta = await hamtaKundportalTurnstileSiteKey();
    const andra = await hamtaKundportalTurnstileSiteKey();

    expect(forsta).toBeNull();
    expect(andra).toBeNull();
    expect(anrop).toBe(2);
  });

  it("gör bara ETT nätverksanrop över flera på-varandra-följande hämtningar", async () => {
    globalThis.fetch = (async () => {
      anrop += 1;
      return new Response(JSON.stringify({ siteKey: "0x4-cachad" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const forsta = await hamtaKundportalTurnstileSiteKey();
    const andra = await hamtaKundportalTurnstileSiteKey();
    const tredje = await hamtaKundportalTurnstileSiteKey();

    expect(forsta).toBe("0x4-cachad");
    expect(andra).toBe("0x4-cachad");
    expect(tredje).toBe("0x4-cachad");
    expect(anrop).toBe(1);
  });
});
