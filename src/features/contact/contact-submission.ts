export type ContactSubmission = {
  name: string;
  email: string;
  phone: string;
  customerType: string;
  service: string;
  urgency: string;
  message: string;
};

export type ContactAssistantContext = {
  contactReason: string;
  context: string;
};

export function composeContactMessage(
  message: string,
  assistantContext: ContactAssistantContext | null,
) {
  if (!assistantContext) return message.trim();

  return [
    `Kontaktorsak: ${assistantContext.contactReason}`,
    assistantContext.context ? `Omfattning: ${assistantContext.context}` : undefined,
    "",
    "Kundens beskrivning:",
    message.trim(),
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
}

export function formatContactEmail(submission: ContactSubmission) {
  const subject = `Supportärende: ${submission.service} (${submission.urgency})`;
  const text = [
    "Nytt ärende till Nova IT",
    "",
    `Namn: ${submission.name}`,
    `E-post: ${submission.email}`,
    `Kontaktväg: ${submission.phone || "Ej angiven"}`,
    `Kundtyp: ${submission.customerType}`,
    `Tjänst: ${submission.service}`,
    `Brådska: ${submission.urgency}`,
    "",
    "Beskrivning:",
    submission.message,
  ].join("\n");

  return { subject, text };
}
