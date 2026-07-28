import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { formatContactEmail } from "./contact-submission";

const CONTACT_FORM_RECIPIENT = "kontakt@nova-it.se";

const contactRequestSchema = z.object({
  kalla: z.enum(["kontaktformular", "supportassistent"]),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(60),
  customerType: z.enum(["Privatperson", "Företag", "Skola", "Annat"]),
  service: z.string().trim().min(1).max(120),
  urgency: z.enum(["Planerat", "Normal", "Akut"]),
  message: z.string().trim().min(10).max(2000),
});

export const submitContactRequest = createServerFn({ method: "POST" })
  .validator(contactRequestSchema)
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.CONTACT_FORM_FROM;

    if (!apiKey || !from) {
      console.error("Contact form delivery is missing RESEND_API_KEY or CONTACT_FORM_FROM.");
      throw new Error("Kontaktformuläret är inte konfigurerat.");
    }

    const { subject, text } = formatContactEmail(data);

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "Nova-IT-contact-form/1.0",
        },
        body: JSON.stringify({
          from,
          to: [CONTACT_FORM_RECIPIENT],
          reply_to: data.email,
          subject,
          text,
        }),
      });

      if (!response.ok) {
        const responseBody = await response.text();
        console.error("Contact form email delivery failed", response.status, responseBody);
        throw new Error("Contact form delivery failed.");
      }
    } catch (error) {
      console.error("Contact form email delivery failed.", error);
      throw new Error("Kontaktformuläret kunde inte skicka ärendet.");
    }

    return { accepted: true, recipient: CONTACT_FORM_RECIPIENT };
  });
