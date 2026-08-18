import { describe, expect, test } from "bun:test";
import { allaDokument, hamtaRelevantaDokument } from "./support-knowledge";

describe("allaDokument", () => {
  test("innehåller dokument från alla tre källorna", () => {
    const dokument = allaDokument();
    expect(dokument.some((doc) => doc.kind === "flow")).toBe(true);
    expect(dokument.some((doc) => doc.kind === "service")).toBe(true);
    expect(dokument.some((doc) => doc.kind === "faq")).toBe(true);
  });

  test("varje dokument har ett unikt id och en källa", () => {
    const dokument = allaDokument();
    const ids = new Set(dokument.map((doc) => doc.id));
    expect(ids.size).toBe(dokument.length);
    for (const doc of dokument) {
      expect(doc.sourceUrl.length).toBeGreaterThan(0);
    }
  });

  test("inga prisdokument finns i korpusen", () => {
    const dokument = allaDokument();
    expect(dokument.some((doc) => doc.id.startsWith("price"))).toBe(false);
  });
});

describe("hamtaRelevantaDokument", () => {
  test("hittar wifi-flödet för en fråga om wifi", () => {
    const traffar = hamtaRelevantaDokument("wifi bryts hela tiden under möten");
    expect(traffar.some((doc) => doc.id === "flow:wifi")).toBe(true);
  });

  test("returnerar en tom lista för en fråga som inte matchar något", () => {
    expect(hamtaRelevantaDokument("xyzxyz obegripligt")).toEqual([]);
  });

  test("respekterar antal-parametern", () => {
    const traffar = hamtaRelevantaDokument("dator problem hjälp support", 2);
    expect(traffar.length).toBeLessThanOrEqual(2);
  });
});
