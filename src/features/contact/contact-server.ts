import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  formatContactEmail,
  formatCustomerConfirmationEmail,
  tillAdminAngelagenhet,
  tillAdminKundtyp,
} from "./contact-submission";

/**
 * Kundens synliga kontaktväg (reply-to på bekräftelsemejlet) - matchar
 * webbplatsens egen text ("Alla förfrågningar går till kontakt@nova-it.se").
 * Ska INTE blandas ihop med `INTERN_AVISERING_MOTTAGARE` nedan - olika
 * syften, kan skilja sig åt.
 */
const CONTACT_FORM_RECIPIENT = "kontakt@nova-it.se";

/**
 * Mottagare för den interna aviseringen om ett nytt ärende. Satt till
 * support@nova-it.se eftersom det matchar adminportalens automatiska
 * ärendetilldelning (se `hittaIntagsansvarig` i adminportalens
 * publikt-intag-server.ts, som letar efter en aktiv profil med just den
 * e-postadressen) - samma person ska få både ärendet i portalen och en
 * avisering i sin egen inkorg.
 */
const INTERN_AVISERING_MOTTAGARE = "support@nova-it.se";

const contactRequestSchema = z.object({
  kalla: z.enum(["kontaktformular", "supportassistent"]),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(60),
  customerType: z.enum(["Privatperson", "Företag", "Skola", "Annat"]),
  companyName: z.string().trim().max(160),
  service: z.string().trim().min(1).max(120),
  tjanstSlug: z.string().trim().min(1).max(60),
  urgency: z.enum(["Planerat", "Normal", "Akut"]),
  message: z.string().trim().min(10).max(2000),
  idempotencyKey: z.string().trim().min(16).max(200),
  // Spam-/missbruksskydd - se skickaKontaktforfragan().
  website: z.string().max(200).optional(), // honeypot, ska alltid vara tomt
  formRenderedAt: z.number(),
  turnstileToken: z.string().max(2048).nullable().optional(),
});

const MIN_SUBMIT_DELAY_MS = 2500;

export type SubmitContactRequestResult = {
  accepted: true;
  arendenummer: string;
  mottagetVid: string;
  confirmationSent: boolean;
};

type ContactRequestData = ReturnType<typeof contactRequestSchema.parse>;

/**
 * Central ärendeintagningsväg för BÅDE kontaktformuläret och
 * supportassistenten (se `kalla`-fältet ovan) - de skiljer sig bara i
 * gränssnitt, inte i backend. Ett lyckat anrop:
 *
 *   1. Skapar/matchar kund och riktigt ärende i adminportalens databas via
 *      den skyddade `/api/public/intag`-endpointen (server-till-server,
 *      delad hemlighet, ALDRIG anropad direkt av besökarens webbläsare).
 *   2. Försöker DÄREFTER skicka en kundbekräftelse via Resend. Ett
 *      misslyckat bekräftelsemejl kastar INTE ett fel - ärendet är redan
 *      skapat och kvar oavsett. `confirmationSent: false` signalerar detta
 *      till klienten, som visar en annan, ärlig text i stället för att
 *      låtsas att bekräftelsen gick fram.
 *
 * Om steg 1 misslyckas (adminportalen nere, avvisar anropet, valideringsfel
 * etc.) kastas ett fel och INGET returneras till klienten - inget
 * ärendenummer visas då, och det finns ingen tyst e-postfallback som gör
 * att ett misslyckat ärendeskapande ändå ser ut som en lyckad inskickning.
 *
 * Logiken bor i `skickaKontaktforfragan` (en vanlig, testbar funktion) i
 * stället för direkt i `.handler()` nedan - `createServerFn`-wrappade
 * funktioner kräver TanStack Starts server-runtime-kontext (AsyncLocalStorage)
 * för att anropas alls, vilket gör dem otestbara isolerat i `bun:test`.
 */
export async function skickaKontaktforfragan(
  data: ContactRequestData,
): Promise<SubmitContactRequestResult> {
  // Honeypot: ett fält som är osynligt och onåbart för en människa som
  // använder formuläret normalt, men som enkla bottar ofta fyller i
  // automatiskt. Generiskt fel - avslöjar inte att det är en spamkontroll.
  if (data.website && data.website.trim().length > 0) {
    console.error("Kontaktformulär avvisat: honeypot-fält ifyllt.");
    throw new Error(
      "Ärendet kunde inte skickas just nu. Försök igen, eller skriv direkt till oss.",
    );
  }

  // Tidskontroll: ett formulär som skickas nästan omedelbart efter att det
  // renderades är typiskt för ett automatiserat skript, inte en människa
  // som läser och fyller i fälten.
  if (Date.now() - data.formRenderedAt < MIN_SUBMIT_DELAY_MS) {
    console.error("Kontaktformulär avvisat: skickades orimligt snabbt efter rendering.");
    throw new Error(
      "Ärendet kunde inte skickas just nu. Försök igen, eller skriv direkt till oss.",
    );
  }

  await verifieraTurnstile(data.turnstileToken ?? null, data.idempotencyKey);

  const intakeUrl = process.env.ADMIN_INTAKE_URL;
  const intakeSecret = process.env.INTAG_SECRET;

  if (!intakeUrl || !intakeSecret) {
    console.error("Public intake is missing ADMIN_INTAKE_URL or INTAG_SECRET.");
    throw new Error("Ärendeintaget är inte konfigurerat just nu. Försök igen om en stund.");
  }

  let intakeResponse: Response;
  try {
    intakeResponse = await fetch(`${intakeUrl}/api/public/intag`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-intag-secret": intakeSecret,
      },
      body: JSON.stringify({
        kalla: data.kalla,
        namn: data.name,
        epost: data.email,
        telefon: data.phone,
        kundtyp: tillAdminKundtyp(data.customerType),
        verksamhetsnamn: data.companyName || undefined,
        tjanstSlug: data.tjanstSlug,
        angelagenhet: tillAdminAngelagenhet(data.urgency),
        meddelande: data.message,
        idempotensnyckel: data.idempotencyKey,
      }),
    });
  } catch (error) {
    console.error("Kunde inte nå det interna ärendeintaget.", error);
    throw new Error("Ärendet kunde inte skickas just nu. Försök igen om en stund.", {
      cause: error,
    });
  }

  const intakeBody = (await intakeResponse.json().catch(() => null)) as {
    accepted?: boolean;
    arendenummer?: string;
    mottagetVid?: string;
    internt?: {
      arendeId?: string;
      kundportalKonto?: { kontoSkapat?: boolean; tillfalligtLosenord?: string };
    };
  } | null;

  if (!intakeResponse.ok || !intakeBody?.accepted || !intakeBody.arendenummer) {
    console.error("Ärendeintaget avvisade förfrågan.", {
      status: intakeResponse.status,
      accepted: intakeBody?.accepted === true,
      hasTicketNumber: typeof intakeBody?.arendenummer === "string",
    });
    throw new Error(
      "Ärendet kunde inte registreras just nu. Försök igen, eller skriv direkt till oss.",
    );
  }

  const { arendenummer, mottagetVid, internt } = intakeBody;

  // Intern avisering till Nova IT, frikopplad från kundbekräftelsen
  // nedan - ärendet syns redan i adminportalen oavsett, så ett
  // misslyckat internt mejl loggas men stoppar aldrig svaret till kunden.
  await forsokSkickaInternAvisering(data, arendenummer);

  const tillfalligtLosenord =
    internt?.kundportalKonto?.kontoSkapat === true
      ? internt.kundportalKonto.tillfalligtLosenord
      : undefined;

  const confirmationSent = await forsokSkickaKundbekraftelse({
    namn: data.name,
    epost: data.email,
    arendenummer,
    tillfalligtLosenord,
  });

  if (internt?.arendeId) {
    await uppdateraBekraftelseStatus({
      intakeUrl,
      intakeSecret,
      arendeId: internt.arendeId,
      status: confirmationSent ? "skickad" : "misslyckad",
    });
  }

  return {
    accepted: true,
    arendenummer,
    mottagetVid: mottagetVid ?? new Date().toISOString(),
    confirmationSent,
  };
}

export const submitContactRequest = createServerFn({ method: "POST" })
  .validator(contactRequestSchema)
  .handler(({ data }) => skickaKontaktforfragan(data));

/**
 * Site Key är offentlig, men hämtas runtime från Workern så att en Wrangler
 * secret inte felaktigt förväntas vara tillgänglig i Vite-buildens klientkod.
 * Secret Key läses aldrig tillbaka till klienten.
 */
export const getTurnstileSiteKey = createServerFn({ method: "GET" }).handler(
  () => process.env.TURNSTILE_SITE_KEY ?? process.env.VITE_TURNSTILE_SITE_KEY ?? null,
);

/**
 * Verifierar en Cloudflare Turnstile-token server-side.
 *
 * Om TURNSTILE_SECRET_KEY saknas är kontrollen avstängd för lokal utveckling.
 * I produktion (eller när TURNSTILE_REQUIRED=true) faller flödet stängt i
 * stället för att tyst degradera till ett oskyddat formulär. När nyckeln finns
 * nekas en saknad, ogiltig, felaktig action eller felaktig hostname alltid.
 */
async function verifieraTurnstile(token: string | null, idempotencyKey: string): Promise<void> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    if (process.env.NODE_ENV === "production" || process.env.TURNSTILE_REQUIRED === "true") {
      console.error("Turnstile-verifiering saknas i obligatorisk produktionskonfiguration.");
      throw new Error("Verifieringen kunde inte genomföras. Försök igen om en stund.");
    }
    return;
  }

  if (!token) {
    throw new Error("Verifieringen kunde inte genomföras. Ladda om sidan och försök igen.");
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
        idempotency_key: idempotencyKey,
      }),
    });
    const result = (await response.json().catch(() => null)) as {
      success?: boolean;
      action?: string;
      hostname?: string;
    } | null;
    const allowedHostnames = new Set([
      "nova-it.se",
      "www.nova-it.se",
      "novait.se",
      "www.novait.se",
    ]);

    if (
      !response.ok ||
      !result?.success ||
      result.action !== "contact" ||
      !result.hostname ||
      !allowedHostnames.has(result.hostname)
    ) {
      throw new Error("Verifieringen kunde inte genomföras. Ladda om sidan och försök igen.");
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Verifieringen")) throw error;
    console.error("Turnstile-verifiering misslyckades.", error);
    throw new Error("Verifieringen kunde inte genomföras. Ladda om sidan och försök igen.", {
      cause: error,
    });
  }
}

async function forsokSkickaInternAvisering(
  data: Parameters<typeof formatContactEmail>[0],
  arendenummer: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FORM_FROM;

  if (!apiKey || !from) {
    console.error(
      "Intern avisering kunde inte skickas - RESEND_API_KEY eller CONTACT_FORM_FROM saknas.",
    );
    return;
  }

  const { subject, text } = formatContactEmail({ ...data, arendenummer });

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
        to: [INTERN_AVISERING_MOTTAGARE],
        reply_to: data.email,
        subject,
        text,
      }),
    });

    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      console.error("Intern avisering kunde inte skickas.", { status: response.status });
    }
  } catch (error) {
    console.error("Intern avisering kunde inte skickas.", error);
  }
}

async function forsokSkickaKundbekraftelse(uppgifter: {
  namn: string;
  epost: string;
  arendenummer: string;
  /**
   * Endast satt när kundportalen faktiskt skapade ett NYTT konto för den här
   * kunden (se skickaKontaktforfragan ovan). Skickas ALDRIG till konsolen
   * eller loggas - den enda platsen detta värde syns är i detta ena mejl.
   */
  tillfalligtLosenord?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FORM_FROM;

  if (!apiKey || !from) {
    console.error(
      "Kundbekräftelse kunde inte skickas - RESEND_API_KEY eller CONTACT_FORM_FROM saknas.",
    );
    return false;
  }

  const { subject, text } = formatCustomerConfirmationEmail(
    uppgifter.namn,
    uppgifter.arendenummer,
    uppgifter.tillfalligtLosenord
      ? { epost: uppgifter.epost, tillfalligtLosenord: uppgifter.tillfalligtLosenord }
      : undefined,
  );

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
        to: [uppgifter.epost],
        reply_to: CONTACT_FORM_RECIPIENT,
        subject,
        text,
      }),
    });

    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      console.error("Kundbekräftelse kunde inte skickas.", { status: response.status });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Kundbekräftelse kunde inte skickas.", error);
    return false;
  }
}

async function uppdateraBekraftelseStatus(uppgifter: {
  intakeUrl: string;
  intakeSecret: string;
  arendeId: string;
  status: "skickad" | "misslyckad";
}): Promise<void> {
  try {
    await fetch(`${uppgifter.intakeUrl}/api/public/intag`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-intag-secret": uppgifter.intakeSecret,
      },
      body: JSON.stringify({ arendeId: uppgifter.arendeId, status: uppgifter.status }),
    });
  } catch (error) {
    // Ärendet är redan skapat och kunden har redan fått (eller inte fått)
    // sin bekräftelse - att inte kunna logga statusen i adminportalen är
    // inte kritiskt nog att misslyckas hela requesten för.
    console.error("Kunde inte uppdatera bekräftelsestatus i adminportalen.", error);
  }
}
