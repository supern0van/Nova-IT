import { describe, expect, test } from "bun:test";
import { supportFlows } from "./support-data";
import { createSupportSummary, getSupportFlow, matchSupportFlow } from "./support-engine";
import type { SupportServiceSlug } from "./support-types";

const flowMatches: Array<[query: string, expectedId: string, expectedService: SupportServiceSlug]> =
  [
    ["Wi-Fi tappar anslutningen", "wifi", "natverk"],
    ["Skrivaren är offline", "printer", "it-support"],
    ["Jag misstänker phishing", "virus", "sakerhet-backup"],
    ["Outlook och MFA fungerar inte", "account", "microsoft-google"],
  ];

describe("support engine", () => {
  test("contains the thirteen planned flows", () => {
    expect(supportFlows).toHaveLength(13);
    expect(new Set(supportFlows.map((flow) => flow.id)).size).toBe(13);
  });

  test.each(flowMatches)("matches %s", (query, expectedId, expectedService) => {
    const flow = matchSupportFlow(query);
    expect(flow.id).toBe(expectedId);
    expect(flow.serviceSlug).toBe(expectedService);
  });

  test("creates a support summary", () => {
    const flow = getSupportFlow("wifi");
    expect(flow).toBeDefined();
    const summary = createSupportSummary({ flow: flow!, option: flow!.options[1] });
    expect(summary).toContain("förberett supportärende");
    expect(summary).toContain("Föreslagen tjänst: natverk");
  });
});
