import { describe, expect, test } from "bun:test";
import { supportFlows } from "./support-data";
import {
  classifySupportQuery,
  createSupportSummary,
  getSupportFlow,
  getSupportOption,
  matchSupportFlow,
} from "./support-engine";
import type { SupportServiceSlug } from "./support-types";

const flowMatches: Array<[query: string, expectedId: string, expectedService: SupportServiceSlug]> =
  [
    ["Wi-Fi tappar anslutningen", "wifi", "natverk"],
    ["Skrivaren är offline", "printer", "it-support"],
    ["Jag misstänker phishing", "virus", "sakerhet-backup"],
    ["Outlook och MFA fungerar inte", "account", "microsoft-google"],
    ["problem med wifi", "wifi", "natverk"],
    ["backup problem", "backup", "sakerhet-backup"],
    ["jag kan inte logga in", "account", "microsoft-google"],
    ["Teams fungerar inte", "account", "microsoft-google"],
    ["skärmen är svart", "windows", "it-support"],
    ["jag fick ett misstänkt mejl", "virus", "sakerhet-backup"],
    ["min dator har problem med virus", "virus", "sakerhet-backup"],
  ];

describe("support engine", () => {
  test("contains the twelve planned public intake flows", () => {
    expect(supportFlows).toHaveLength(12);
    expect(new Set(supportFlows.map((flow) => flow.id)).size).toBe(12);
    expect(JSON.stringify(supportFlows)).not.toContain("ChromeOS Flex");
  });

  test("keeps flow data internally consistent", () => {
    for (const flow of supportFlows) {
      expect(flow.firstSteps.length).toBeGreaterThanOrEqual(3);
      expect(flow.options).toHaveLength(4);
      expect(new Set(flow.options.map((option) => option.id)).size).toBe(flow.options.length);
      expect(flow.keywords.length).toBeGreaterThan(0);
    }
  });

  test("keeps the guide focused on intake instead of self-service repairs", () => {
    const intakeVerbs = [
      "Ange",
      "Beskriv",
      "Bestäm",
      "Kontakta",
      "Låt",
      "Notera",
      "Skriv",
      "Spara",
      "Ta",
    ];
    const prohibitedInstructions =
      /starta om|rensa registret|installera genom|kör kommandot|öppna terminalen/i;

    for (const flow of supportFlows) {
      for (const step of flow.firstSteps) {
        expect(intakeVerbs.some((verb) => step.startsWith(verb))).toBe(true);
        expect(step).not.toMatch(prohibitedInstructions);
      }
      for (const option of flow.options) expect(option.reply).not.toMatch(prohibitedInstructions);
    }
  });

  test.each(flowMatches)("matches %s", (query, expectedId, expectedService) => {
    const flow = matchSupportFlow(query);
    expect(flow.id).toBe(expectedId);
    expect(flow.serviceSlug).toBe(expectedService);
  });

  test("creates a support summary", () => {
    const flow = getSupportFlow("wifi");
    expect(flow).toBeDefined();
    const summary = createSupportSummary({
      flow: flow!,
      impact: "Flera personer eller enheter",
      option: flow!.options[1],
      timing: "Det kommer och går",
    });
    expect(summary).toContain("förberett supportärende");
    expect(summary).toContain("Bra att ha med:");
    expect(summary).toContain("När hjälp behövs:");
    expect(summary).toContain("Påverkan: Flera personer eller enheter");
    expect(summary).toContain("Tidsbild: Det kommer och går");
  });

  test("returns a low-confidence clarification for an unknown question", () => {
    const match = classifySupportQuery("Kan ni hjälpa med min webbplats?");
    expect(match.flow.id).toBe("general");
    expect(match.confidence).toBe("low");
    expect(match.requiresClarification).toBe(true);
    expect(match.alternatives.length).toBeGreaterThan(0);
  });

  test("prioritizes security language and urgency", () => {
    const match = classifySupportQuery("Filer är krypterade och jag ser ett betalningskrav");
    expect(match.flow.id).toBe("virus");
    expect(match.confidence).toBe("high");
    expect(match.urgency).toBe("urgent");

    const intrusion = classifySupportQuery(
      "Jag klickade på ett misstänkt mejl och nu tror jag att någon har kommit in",
    );
    expect(intrusion.flow.id).toBe("virus");
    expect(intrusion.urgency).toBe("urgent");
  });

  test("normalizes case, punctuation and Swedish diacritics", () => {
    expect(matchSupportFlow("WIFI!!! tappar anslutningen").id).toBe("wifi");
    expect(matchSupportFlow("Datorn är LANGSAM").id).toBe("slow-computer");
  });

  test("finds support options without leaking invalid ids", () => {
    const flow = getSupportFlow("printer")!;
    expect(getSupportOption(flow, "print-offline")?.label).toBe("Offline");
    expect(getSupportOption(flow, "missing")).toBeUndefined();
  });
});
