export type ContactKalla = "kontaktformular" | "supportassistent";

export type ContactSubmission = {
  kalla: ContactKalla;
  name: string;
  email: string;
  phone: string;
  customerType: string;
  service: string;
  urgency: string;
  message: string;
  arendenummer?: string;
};

const kallaLabel: Record<ContactKalla, string> = {
  kontaktformular: "Kontaktformulär",
  supportassistent: "Supportassistent",
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

/**
 * Adminportalens motsvarande typer (`Kundtyp`, angelägenhet -> `Prioritet`).
 * Denna sajt har inte tillgång till portalens `lib/types.ts` (separat app),
 * så mappningen hålls medvetet explicit och liten här i stället för att
 * återanvända ett gemensamt enum-namn som råkar likna varandra.
 */
export type AdminKundtyp = "privatperson" | "verksamhet";
export type AdminAngelagenhet = "planerad" | "normal" | "akut";

const customerTypeToAdminKundtyp: Record<string, AdminKundtyp> = {
  Privatperson: "privatperson",
  Företag: "verksamhet",
  Skola: "verksamhet",
  Annat: "verksamhet",
};

const urgencyToAdminAngelagenhet: Record<string, AdminAngelagenhet> = {
  Planerat: "planerad",
  Normal: "normal",
  Akut: "akut",
};

export function tillAdminKundtyp(customerType: string): AdminKundtyp {
  return customerTypeToAdminKundtyp[customerType] ?? "privatperson";
}

export function tillAdminAngelagenhet(urgency: string): AdminAngelagenhet {
  return urgencyToAdminAngelagenhet[urgency] ?? "normal";
}

export function formatContactEmail(submission: ContactSubmission) {
  const subject = `Supportärende: ${submission.service} (${submission.urgency})`;
  const text = [
    "Nytt ärende till Nova IT",
    "",
    submission.arendenummer ? `Ärendenummer: ${submission.arendenummer}` : undefined,
    `Källa: ${kallaLabel[submission.kalla]}`,
    `Namn: ${submission.name}`,
    `E-post: ${submission.email}`,
    `Kontaktväg: ${submission.phone || "Ej angiven"}`,
    `Kundtyp: ${submission.customerType}`,
    `Tjänst: ${submission.service}`,
    `Brådska: ${submission.urgency}`,
    "",
    "Beskrivning:",
    submission.message,
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");

  return { subject, text };
}

/**
 * Kundens mottagningsbekräftelse - inte samma sak som `formatContactEmail`
 * (som är den interna aviseringen till Nova IT). Innehåller uttryckligen
 * ingen uppmaning om att skicka lösenord/koder i svar, och inget som ser ut
 * som en teknisk lösning innan ärendet faktiskt bedömts.
 */
export function formatCustomerConfirmationEmail(namn: string, arendenummer: string) {
  const subject = `Din förfrågan är mottagen – ${arendenummer}`;
  const text = [
    `Hej ${namn},`,
    "",
    "Tack för din förfrågan till Nova IT. Den är nu registrerad.",
    "",
    `Ärendenummer: ${arendenummer}`,
    "",
    "Vi återkommer så snart vi kan med hur vi bäst kan hjälpa till.",
    "",
    "Skriv gärna direkt på det här mejlet om du vill lägga till något - men skicka",
    "aldrig lösenord, engångskoder eller annan känslig information i ett svar.",
    "",
    "Vänliga hälsningar,",
    "Nova IT",
  ].join("\n");

  return { subject, text };
}
