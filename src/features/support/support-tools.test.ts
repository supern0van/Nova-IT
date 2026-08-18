import { describe, expect, test } from "bun:test";
import {
  FELSOKNING_ERSATTNINGSSVAR,
  isSupportServiceSlug,
  isSupportUrgency,
  resolveUrgency,
  sanitizeQuickReplies,
  sanitizeReply,
} from "./support-tools";

describe("resolveUrgency", () => {
  test("modellen kan höja nivån regelmotorn satte", () => {
    expect(resolveUrgency("standard", "urgent")).toBe("urgent");
    expect(resolveUrgency("standard", "priority")).toBe("priority");
    expect(resolveUrgency("priority", "urgent")).toBe("urgent");
  });

  test("modellen kan ALDRIG sänka nivån regelmotorn satte", () => {
    expect(resolveUrgency("urgent", "standard")).toBe("urgent");
    expect(resolveUrgency("urgent", "priority")).toBe("urgent");
    expect(resolveUrgency("priority", "standard")).toBe("priority");
  });

  test("saknad eller ogiltig modellnivå faller tillbaka på regelmotorns", () => {
    expect(resolveUrgency("priority", null)).toBe("priority");
    expect(resolveUrgency("priority", undefined)).toBe("priority");
    expect(resolveUrgency("priority", "hittepa" as never)).toBe("priority");
  });

  test("samma nivå ger samma nivå", () => {
    expect(resolveUrgency("standard", "standard")).toBe("standard");
  });
});

describe("isSupportUrgency / isSupportServiceSlug", () => {
  test("accepterar bara giltiga värden", () => {
    expect(isSupportUrgency("urgent")).toBe(true);
    expect(isSupportUrgency("akut")).toBe(false);
    expect(isSupportUrgency(42)).toBe(false);

    expect(isSupportServiceSlug("natverk")).toBe(true);
    expect(isSupportServiceSlug("root-access")).toBe(false);
    expect(isSupportServiceSlug(null)).toBe(false);
  });
});

describe("sanitizeQuickReplies", () => {
  test("plockar max 4 korta strängar och kastar allt annat", () => {
    expect(
      sanitizeQuickReplies(["Ja", "Nej", "Vet inte", "Ring mig", "Det femte", "Sjätte"]),
    ).toEqual(["Ja", "Nej", "Vet inte", "Ring mig"]);
  });

  test("filtrerar bort orimligt långa eller icke-sträng-poster", () => {
    const langt = "x".repeat(200);
    expect(sanitizeQuickReplies(["Ja", langt, 42, null, ""])).toEqual(["Ja"]);
  });

  test("hanterar icke-array indata utan att kasta", () => {
    expect(sanitizeQuickReplies(undefined)).toEqual([]);
    expect(sanitizeQuickReplies("inte en array")).toEqual([]);
  });
});

describe("sanitizeReply - andra försvarslinjen mot felsökningsråd", () => {
  test("släpper igenom ett normalt svar oförändrat", () => {
    expect(sanitizeReply("Vi hjälper gärna till med det här.")).toBe(
      "Vi hjälper gärna till med det här.",
    );
  });

  test("byter ut ett svar som innehåller felsökningsinstruktioner", () => {
    expect(sanitizeReply("Prova att starta om datorn och se om det hjälper.")).toBe(
      FELSOKNING_ERSATTNINGSSVAR,
    );
    expect(sanitizeReply("Du kan rensa registret för att fixa det.")).toBe(
      FELSOKNING_ERSATTNINGSSVAR,
    );
  });

  test("ett tomt svar blir också ersättningssvaret", () => {
    expect(sanitizeReply("   ")).toBe(FELSOKNING_ERSATTNINGSSVAR);
  });
});
