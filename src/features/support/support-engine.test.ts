import { describe, expect, test } from "bun:test";
import { supportFlows } from "./support-data";
import { createSupportSummary, getSupportFlow, matchSupportFlow } from "./support-engine";

describe("support engine", () => {
  test("contains the thirteen planned flows", () => {
    expect(supportFlows).toHaveLength(13);
    expect(new Set(supportFlows.map((flow) => flow.id)).size).toBe(13);
  });

  test.each([
    ["Wi-Fi tappar anslutningen", "wifi", "natverk"],
    ["Skrivaren är offline", "printer", "it-support"],
    ["Jag misstänker phishing", "virus", "sakerhet-backup"],
    ["Outlook och MFA fungerar inte", "account", "microsoft-google"],
  ])("matches %s", (query, expectedId, expectedService) => {
    const flow = matchSupportFlow(query);
    expect(flow.id).toBe(expectedId);
    expect(flow.serviceSlug).toBe(expectedService);
  });

  test("creates a demo-safe summary", () => {
    const flow = getSupportFlow("wifi");
    expect(flow).toBeDefined();
    const summary = createSupportSummary({ flow: flow!, option: flow!.options[1] });
    expect(summary).toContain("Inga kontaktuppgifter");
    expect(summary).toContain("Föreslagen tjänst: natverk");
  });
});
