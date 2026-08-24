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
  /**
   * Den guidade konversationen från supportassistenten. Följer med in i
   * ärendets beskrivning så att adminportalen får hela dialogen som logg,
   * inte bara en enradsrubrik. Se `createSupportTranscript` i
   * `features/support/support-engine.ts`.
   */
  transcript?: string;
};

/**
 * Adminportalens `/api/public/intag` avvisar hela ärendet om beskrivningen
 * överstiger 2000 tecken (`arGiltigMeddelande` i dess
 * `publikt-intag-server.ts`). Kundens egen text är redan begränsad till 2000
 * i formulärets schema, så när assistentens kontext läggs till MÅSTE det
 * sammansatta resultatet kortas här - annars kan ett ärende som kunden
 * skrivit korrekt ändå misslyckas i sista steget.
 */
const MAX_ARENDE_BESKRIVNING = 2000;

/**
 * En hård `.slice()` utan spår kan i sällsynta fall klippa kundens egen text
 * mitt i en mening - internt ärende ser då ut som ett trasigt/avbrutet
 * meddelande i stället för en medveten kortning. Lägger till en synlig
 * markör NÄR det faktiskt klipptes, aldrig annars - markören ryms alltid
 * inom gränsen (dras av från utrymmet innan klippningen görs).
 */
const KLIPPT_MARKOR = "\n\n… (fortsättning klippt)";

function klippMedMarkor(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - KLIPPT_MARKOR.length) + KLIPPT_MARKOR;
}

export function composeContactMessage(
  message: string,
  assistantContext: ContactAssistantContext | null,
) {
  if (!assistantContext) return klippMedMarkor(message.trim(), MAX_ARENDE_BESKRIVNING);

  const sammansatt = [
    `Kontaktorsak: ${assistantContext.contactReason}`,
    assistantContext.context ? `Omfattning: ${assistantContext.context}` : undefined,
    assistantContext.transcript ? "" : undefined,
    assistantContext.transcript ? "Guidad dialog:" : undefined,
    assistantContext.transcript ? assistantContext.transcript : undefined,
    "",
    "Kundens beskrivning:",
    message.trim(),
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");

  if (sammansatt.length <= MAX_ARENDE_BESKRIVNING) return sammansatt;

  // Kundens egna ord är alltid viktigast och får aldrig offras för
  // guidens metadata - därför kortas dialogen först, och bara om det
  // fortfarande inte räcker kortas hela texten hårt.
  const utanDialog = [
    `Kontaktorsak: ${assistantContext.contactReason}`,
    assistantContext.context ? `Omfattning: ${assistantContext.context}` : undefined,
    "",
    "Kundens beskrivning:",
    message.trim(),
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");

  return klippMedMarkor(utanDialog, MAX_ARENDE_BESKRIVNING);
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
 *
 * `kundportalKonto` är bara satt när kundportalen (Milstolpe 2, se
 * docs/kundportal-planering.md i huvudrepot) faktiskt skapade ett NYTT konto
 * för den här kunden - en återkommande kund som redan har ett konto får
 * ingen (ny) aktiveringslänk, bara den vanliga bekräftelsetexten.
 *
 * `aktiveringslank` är ALLTID en länk, ALDRIG ett lösenord - en Supabase
 * Auth-genererad, engångsanvändbar, tidsbegränsad `invite`-länk (se
 * Nova-IT-Portaler/kundportal/lib/admin/kundkonto-server.ts). Kunden väljer
 * sitt eget lösenord först på kundportalens /aktivera-konto. Den här
 * funktionen får ALDRIG innehålla ett lösenordsfält - se den granskning
 * som ledde fram till detta (kundportalskontots aktiveringsflöde,
 * 19 augusti 2026).
 */
export function formatCustomerConfirmationEmail(
  namn: string,
  arendenummer: string,
  kundportalKonto?: { epost: string; aktiveringslank: string },
) {
  const subject = `Din förfrågan är mottagen – ${arendenummer}`;
  const text = [
    `Hej ${namn},`,
    "",
    "Tack för din förfrågan till Nova IT. Den är nu registrerad.",
    "",
    `Ärendenummer: ${arendenummer}`,
    "",
    "Vi återkommer så snart vi kan med hur vi bäst kan hjälpa till.",
    ...(kundportalKonto
      ? [
          "",
          "Ett konto till kundportalen har skapats åt dig.",
          "",
          "Aktivera kontot och välj ditt lösenord:",
          kundportalKonto.aktiveringslank,
          "",
          "Länken är tidsbegränsad och kan bara användas en gång. När kontot är",
          "aktiverat kan du logga in i kundportalen och följa ditt ärende.",
        ]
      : []),
    "",
    "Skriv gärna direkt på det här mejlet om du vill lägga till något - men skicka",
    "aldrig lösenord, engångskoder eller annan känslig information i ett svar.",
    "",
    "Vänliga hälsningar,",
    "Nova IT",
  ].join("\n");

  return { subject, text };
}
