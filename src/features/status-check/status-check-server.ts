import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Ärendestatuskoll utan inloggning - kunden anger arendenummer + e-post,
 * samma uppgifter de fick i bekräftelsen när ärendet skapades (se
 * `contact-server.ts`). Speglar det mönstret rakt av: honeypot +
 * tidskontroll + Turnstile, server-till-server-anrop mot adminportalens
 * `/api/public/arendestatus` med en EGEN, distinkt hemlighet
 * (`STATUSKOLL_SECRET`) - delar aldrig värde med `INTAG_SECRET`.
 */

const statusCheckSchema = z.object({
  ticketNumber: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(255),
  // Spam-/missbruksskydd - samma mönster som kontaktformuläret.
  website: z.string().max(200).optional(), // honeypot, ska alltid vara tomt
  formRenderedAt: z.number(),
  turnstileToken: z.string().max(2048).nullable().optional(),
});

const MIN_SUBMIT_DELAY_MS = 2000;

type StatusCheckData = ReturnType<typeof statusCheckSchema.parse>;

export interface ArendeStatusSteg {
  nyckel: string;
  etikett: string;
  tidpunkt: string;
}

export interface ArendeStatusResultat {
  arendenummer: string;
  rubrik: string;
  status: string;
  kategori: string;
  skapad: string;
  uppdaterad: string;
  steg: ArendeStatusSteg[];
}

export type StatusCheckResult =
  | { funnet: true; arende: ArendeStatusResultat }
  | { funnet: false };

/**
 * En generell, ärlig men icke-avslöjande felmedvetenhet - matchar redan
 * det svar adminportalen ger (`funnet: false`) för både fel e-post och ett
 * obefintligt ärendenummer, så statuskollen kan aldrig användas för att
 * pröva sig fram till giltiga ärendenummer eller e-postadresser.
 */
export async function slaUppArendestatus(
  data: StatusCheckData,
): Promise<StatusCheckResult> {
  // Honeypot - samma princip som kontaktformuläret.
  if (data.website && data.website.trim().length > 0) {
    console.error("Ärendestatuskoll avvisad: honeypot-fält ifyllt.");
    throw new Error("Uppslaget kunde inte genomföras just nu. Försök igen om en stund.");
  }

  if (Date.now() - data.formRenderedAt < MIN_SUBMIT_DELAY_MS) {
    console.error("Ärendestatuskoll avvisad: skickades orimligt snabbt efter rendering.");
    throw new Error("Uppslaget kunde inte genomföras just nu. Försök igen om en stund.");
  }

  await verifieraTurnstile(data.turnstileToken ?? null, `${data.ticketNumber}:${data.email}`);

  const statuskollUrl = process.env.ADMIN_INTAKE_URL;
  const statuskollSecret = process.env.STATUSKOLL_SECRET;

  if (!statuskollUrl || !statuskollSecret) {
    console.error("Ärendestatuskoll saknar ADMIN_INTAKE_URL eller STATUSKOLL_SECRET.");
    throw new Error("Statuskollen är inte konfigurerad just nu. Försök igen om en stund.");
  }

  let response: Response;
  try {
    response = await fetch(`${statuskollUrl}/api/public/arendestatus`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-statuskoll-secret": statuskollSecret,
      },
      body: JSON.stringify({
        arendenummer: data.ticketNumber,
        epost: data.email,
      }),
    });
  } catch (error) {
    console.error("Kunde inte nå den interna ärendestatuskollen.", error);
    throw new Error("Uppslaget kunde inte genomföras just nu. Försök igen om en stund.", {
      cause: error,
    });
  }

  if (response.status === 429) {
    throw new Error(
      "För många uppslag på kort tid. Vänta en stund och försök igen, eller skriv till oss.",
    );
  }

  const body = (await response.json().catch(() => null)) as {
    ok?: boolean;
    funnet?: boolean;
    arende?: ArendeStatusResultat;
  } | null;

  if (!response.ok || !body?.ok) {
    console.error("Ärendestatuskollen avvisade förfrågan.", { status: response.status });
    throw new Error("Uppslaget kunde inte genomföras just nu. Försök igen, eller skriv direkt till oss.");
  }

  if (!body.funnet || !body.arende) {
    return { funnet: false };
  }

  return { funnet: true, arende: body.arende };
}

export const checkTicketStatus = createServerFn({ method: "POST" })
  .validator(statusCheckSchema)
  .handler(({ data }) => slaUppArendestatus(data));

/**
 * Verifierar en Cloudflare Turnstile-token server-side. Egen `action`
 * ("statuskoll") - skiljer sig medvetet från kontaktformulärets
 * ("contact") så ett token från det ena flödet inte kan återanvändas i det
 * andra. I övrigt identisk kontroll som `contact-server.ts`s motsvarighet.
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
      result.action !== "statuskoll" ||
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
