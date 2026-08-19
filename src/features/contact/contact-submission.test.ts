import { expect, test } from "bun:test";
import {
  composeContactMessage,
  formatContactEmail,
  formatCustomerConfirmationEmail,
  tillAdminAngelagenhet,
  tillAdminKundtyp,
} from "./contact-submission";

test("formats a support summary for server-side delivery", () => {
  const email = formatContactEmail({
    kalla: "kontaktformular",
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
  expect(email.text).toContain("Källa: Kontaktformulär");
});

test("labels submissions that came through the support assistant", () => {
  const email = formatContactEmail({
    kalla: "supportassistent",
    name: "Björn Berg",
    email: "bjorn@example.se",
    phone: "",
    customerType: "Privatperson",
    service: "IT-support",
    urgency: "Normal",
    message: "Datorn startar inte.",
  });

  expect(email.text).toContain("Källa: Supportassistent");
});

test("includes the ärendenummer line only when one is provided", () => {
  const utan = formatContactEmail({
    kalla: "kontaktformular",
    name: "Anna Andersson",
    email: "anna@example.se",
    phone: "",
    customerType: "Privatperson",
    service: "IT-support",
    urgency: "Normal",
    message: "Datorn startar inte.",
  });
  expect(utan.text).not.toContain("Ärendenummer:");

  const med = formatContactEmail({
    kalla: "kontaktformular",
    name: "Anna Andersson",
    email: "anna@example.se",
    phone: "",
    customerType: "Privatperson",
    service: "IT-support",
    urgency: "Normal",
    message: "Datorn startar inte.",
    arendenummer: "NIT-2601",
  });
  expect(med.text).toContain("Ärendenummer: NIT-2601");
});

test("maps customer type to the admin portal's kundtyp, defaulting to privatperson", () => {
  expect(tillAdminKundtyp("Privatperson")).toBe("privatperson");
  expect(tillAdminKundtyp("Företag")).toBe("verksamhet");
  expect(tillAdminKundtyp("Skola")).toBe("verksamhet");
  expect(tillAdminKundtyp("Annat")).toBe("verksamhet");
  expect(tillAdminKundtyp("okänt-värde")).toBe("privatperson");
});

test("maps urgency to the admin portal's prioritet scale, never to kritisk", () => {
  expect(tillAdminAngelagenhet("Planerat")).toBe("planerad");
  expect(tillAdminAngelagenhet("Normal")).toBe("normal");
  expect(tillAdminAngelagenhet("Akut")).toBe("akut");
  expect(tillAdminAngelagenhet("okänt-värde")).toBe("normal");
});

test("formats a customer confirmation email with the ärendenummer and no leaked instructions", () => {
  const email = formatCustomerConfirmationEmail("Anna Andersson", "NIT-2601");

  expect(email.subject).toContain("NIT-2601");
  expect(email.text).toContain("Ärendenummer: NIT-2601");
  expect(email.text).toContain("Anna Andersson");
  expect(email.text.toLowerCase()).toContain("aldrig lösenord");
  expect(email.text).not.toContain("kundportal");
});

test("includes an activation link only when a new kundportal account was created - never a password", () => {
  const aktiveringslank =
    "https://xyzcompany.supabase.co/auth/v1/verify?token=abc123&type=invite&redirect_to=https://kundportal.nova-it.se/aktivera-konto";
  const email = formatCustomerConfirmationEmail("Anna Andersson", "NIT-2601", {
    epost: "anna@example.se",
    aktiveringslank,
  });

  expect(email.text).toContain("kundportal");
  expect(email.text).toContain(aktiveringslank);
  expect(email.text.toLowerCase()).not.toContain("lösenord: ");
  expect(email.text.toLowerCase()).not.toMatch(/tillfälligt lösenord/);
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

test("carries the guided dialogue into the ticket description", () => {
  const message = composeContactMessage("Kameran syns inte i Teams.", {
    contactReason: "Videomöten, kamera och ljud – Kameran syns inte",
    context: "Arbetet står still · Det började nyligen",
    transcript: [
      "Guidat område: Videomöten, kamera och ljud",
      "Guidens bedömning: Prioriterat",
      "Kundens egna ord: Kameran syns inte i Teams.",
    ].join("\n"),
  });

  expect(message).toContain("Guidad dialog:");
  expect(message).toContain("Guidens bedömning: Prioriterat");
  expect(message).toContain("Kundens beskrivning:\nKameran syns inte i Teams.");
});

test("never exceeds the admin intake description limit", () => {
  const message = composeContactMessage("x".repeat(1900), {
    contactReason: "Wi-Fi och nätverk – Tappar anslutning",
    context: "Flera personer eller enheter · Det kommer och går",
    transcript: "y".repeat(1500),
  });

  expect(message.length).toBeLessThanOrEqual(2000);
  // Kundens egna ord får aldrig offras för guidens metadata.
  expect(message).toContain("Kundens beskrivning:");
  expect(message).not.toContain("Guidad dialog:");
});
