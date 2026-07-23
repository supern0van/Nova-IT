import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { formatContactEmail } from "./contact-submission";

const contactRequestSchema = z.object({
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
    const recipient = process.env.CONTACT_FORM_TO ?? "kontakt@nova-it.se";

    if (!apiKey || !from) {
      return { accepted: false as const, fallback: "email" as const };
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
          to: [recipient],
          reply_to: data.email,
          subject,
          text,
        }),
      });

      if (!response.ok) {
        return { accepted: false as const, fallback: "email" as const };
      }
    } catch {
      return { accepted: false as const, fallback: "email" as const };
    }

    return { accepted: true as const };
  });