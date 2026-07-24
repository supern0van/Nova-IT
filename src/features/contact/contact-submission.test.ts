import { expect, test } from "bun:test";
import { composeContactMessage, formatContactEmail } from "./contact-submission";

test("formats a support summary for server-side delivery", () => {
  const email = formatContactEmail({
    name: "Anna Andersson",
    email: "anna@example.se",
    phone: "070-123 45 67",
    customerType: "Företag",
    service: "Nätverk och Wi-Fi",
    urgency: "Akut",
    message: "Wi-Fi faller bort i mötesrummet.",
  });

  expect(email.subject).toBe("Supportärende: Nätverk och Wi-Fi (Akut)");
  expect(email.text).toContain("Wi-Fi faller bort i mötesrummet.");
  expect(email.text).toContain("Namn: Anna Andersson");
});

test("keeps the locked contact reason separate from the customer's description", () => {
  const message = composeContactMessage("Nätet bryts under videomöten.", {
    contactReason: "Wi-Fi och nätverk – Tappar anslutning",
    context: "Flera personer eller enheter · Det kommer och går",
  });

  expect(message).toBe(
    [
      "Kontaktorsak: Wi-Fi och nätverk – Tappar anslutning",
      "Omfattning: Flera personer eller enheter · Det kommer och går",
      "",
      "Kundens beskrivning:",
      "Nätet bryts under videomöten.",
    ].join("\n"),
  );
});
