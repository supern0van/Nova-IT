import { describe, expect, it } from "bun:test";

import {
  KUNDPORTAL_TURNSTILE_CONFIG_URL,
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
