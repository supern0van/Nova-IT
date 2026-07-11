import { expect, test } from "bun:test";
import { createContactEmailDraft } from "./contact-submission";

test("creates an encoded email draft with the support summary", () => {
  const draft = createContactEmailDraft(
    {
      name: "Anna Andersson",
      email: "anna@example.se",
      phone: "070-123 45 67",
      customerType: "Företag",
      service: "Nätverk och Wi-Fi",
      urgency: "Akut",
      message: "Wi-Fi faller bort i mötesrummet.",
    },
    "support@example.se",
  );

  expect(draft).toStartWith("mailto:support%40example.se?");
  expect(decodeURIComponent(draft)).toContain("Supportärende: Nätverk och Wi-Fi (Akut)");
  expect(decodeURIComponent(draft)).toContain("Wi-Fi faller bort i mötesrummet.");
});
