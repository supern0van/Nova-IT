import { describe, expect, test } from "bun:test";
import { supportFlows } from "./support-data";
import {
  classifySupportQuery,
  createSupportSummary,
  createSupportTranscript,
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
    // Områden som tillkom när kunskapsbasen breddades.
    ["kameran syns inte i videomöte", "video-meeting", "microsoft-google"],
    ["min externa hårddisk känns inte igen", "external-storage", "sakerhet-backup"],
    ["fläkten låter mycket och datorn blir jättevarm", "cleaning-service", "datorservice"],
    ["vi behöver ett gästnät till föreningen", "office-network", "natverk"],
    ["jag vill byta till ssd", "upgrade", "datorservice"],
  ];

describe("support engine", () => {
  test("covers the full public intake catalogue without duplicate ids", () => {
    expect(supportFlows.length).toBeGreaterThanOrEqual(17);
    expect(new Set(supportFlows.map((flow) => flow.id)).size).toBe(supportFlows.length);
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
      "Lista",
      "Låt",
      "Notera",
      "Planera",
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

  test("matches inflected Swedish word forms, not just exact keywords", () => {
    // "långsamt"/"långsamma" ska landa i samma spår som "långsam".
    expect(matchSupportFlow("datorn har blivit långsammare").id).toBe("slow-computer");
    expect(matchSupportFlow("uppkopplingen är instabil och routern startar om").id).toBe("wifi");
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

  test("creates a transcript with the customer's own answers, not the guide's advice", () => {
    const flow = getSupportFlow("wifi")!;
    const transcript = createSupportTranscript({
      flow,
      impact: "Arbetet står still",
      option: flow.options[1],
      query: "Nätet bryts under möten",
      timing: "Det kommer och går",
      urgency: "priority",
    });

    expect(transcript).toContain("Guidat område: Wi-Fi och nätverk");
    expect(transcript).toContain("Kundens egna ord: Nätet bryts under möten");
    expect(transcript).toContain("Påverkan → Arbetet står still");
    expect(transcript).toContain("Guidens bedömning: Prioriterat");
    // Guidens checklistor är till för kunden och ska inte tynga ärendet.
    expect(transcript).not.toContain("Bra att ha med");
    expect(transcript).not.toContain(flow.escalation);
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

  test("raises urgency when work is blocked, without changing the category", () => {
    const match = classifySupportQuery("Skrivaren är offline och hela kontoret står still");
    expect(match.flow.id).toBe("printer");
    expect(match.urgency).toBe("priority");
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
