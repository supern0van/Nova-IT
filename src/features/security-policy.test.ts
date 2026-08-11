import { expect, test } from "bun:test";

import { FORM_ACTION_DIRECTIVE, KUNDPORTAL_ORIGIN } from "../lib/security-policy";

test("CSP tillåter portalmenyns avgränsade formulärpost till kundportalen", () => {
  expect(FORM_ACTION_DIRECTIVE).toBe(`form-action 'self' ${KUNDPORTAL_ORIGIN}`);
  expect(FORM_ACTION_DIRECTIVE).not.toContain("*");
});
