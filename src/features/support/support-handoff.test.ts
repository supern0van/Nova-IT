import { describe, expect, test } from "bun:test";
import { createSupportHandoff, parseSupportHandoff } from "./support-handoff";

const now = new Date("2026-07-22T12:00:00Z").getTime();

describe("support handoff", () => {
  test("creates and validates a short-lived handoff", () => {
    const handoff = createSupportHandoff(
      {
        contactReason: "  Wi-Fi och nätverk – Tappar anslutning  ",
        context: "Arbetet står still · Det kommer och går",
        customerDescription: "Nätet bryts under möten.",
        guidance: "Beskriv vad som händer, när det började och vad det påverkar.",
        transcript: "Nova IT – förberett supportärende\nOmråde: Wi-Fi och nätverk",
        serviceSlug: "natverk",
        urgency: "priority",
      },
      now,
    );

    expect(handoff.contactReason).toBe("Wi-Fi och nätverk – Tappar anslutning");
    expect(handoff.transcript).toContain("förberett supportärende");
    expect(parseSupportHandoff(JSON.stringify(handoff), now + 10_000)).toEqual(handoff);
  });

  test("truncates an oversized transcript instead of rejecting the handoff", () => {
    const handoff = createSupportHandoff(
      {
        contactReason: "Förbered support",
        context: "",
        customerDescription: "",
        guidance: "Beskriv vad som händer, när det började och vad det påverkar.",
        transcript: "x".repeat(5000),
        serviceSlug: "it-support",
        urgency: "standard",
      },
      now,
    );

    expect(handoff.transcript.length).toBe(1600);
  });

  test("rejects expired, malformed and unknown handoffs", () => {
    const handoff = createSupportHandoff(
      {
        contactReason: "Förbered support",
        context: "",
        customerDescription: "",
        guidance: "Beskriv vad som händer, när det började och vad det påverkar.",
        transcript: "Nova IT – förberett supportärende",
        serviceSlug: "it-support",
        urgency: "standard",
      },
      now,
    );

    expect(parseSupportHandoff(JSON.stringify(handoff), now + 31 * 60 * 1000)).toBeNull();
    expect(parseSupportHandoff("not json", now)).toBeNull();
    expect(
      parseSupportHandoff(JSON.stringify({ ...handoff, serviceSlug: "hemlig-tjanst" }), now),
    ).toBeNull();
    expect(parseSupportHandoff(JSON.stringify({ ...handoff, version: 2 }), now)).toBeNull();
  });
});
