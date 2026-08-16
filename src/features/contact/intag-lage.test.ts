import { describe, expect, test } from "bun:test";
import { INTAG_STANGT_MEDDELANDE, lasIntagLage } from "./intag-lage";

describe("intagets läge", () => {
  test("är öppet som standard", () => {
    expect(lasIntagLage(undefined)).toBe("oppen");
    expect(lasIntagLage("")).toBe("oppen");
    expect(lasIntagLage("oppen")).toBe("oppen");
  });

  test("stängs bara av ett uttryckligt värde", () => {
    expect(lasIntagLage("stangd")).toBe("stangd");
    expect(lasIntagLage("  STANGD  ")).toBe("stangd");
  });

  test("faller tillbaka till öppet vid felstavning i stället för att tyst stänga", () => {
    // Ett stängt intag som ingen upptäckt är värre än ett som kräver ett
    // medvetet värde för att låsas.
    expect(lasIntagLage("stängd")).toBe("oppen");
    expect(lasIntagLage("closed")).toBe("oppen");
    expect(lasIntagLage("true")).toBe("oppen");
  });

  test("meddelandet pekar kunden vidare i stället för att bara neka", () => {
    expect(INTAG_STANGT_MEDDELANDE).toContain("kontakt@nova-it.se");
  });
});
