import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * "Följ ditt ärende" - status utan att logga in i kundportalen. Ett kundkonto
 * (Supabase-inloggning i hela kundportalen) är onödigt tungt för frågan "är
 * ni på väg?": den här sidan (`/arendestatus`) frågar bara efter
 * ärendenummer + e-post, samma två uppgifter kunden redan fick i
 * bekräftelsemejlet när ärendet skapades (se `contact-server.ts`).
 *
 * Anropar adminportalens `/api/public/arendestatus` server-till-server, med
 * en egen, distinkt delad hemlighet (`STATUSKOLL_SECRET`) - samma
 * "en hemlighet per gräns"-princip som `INTAG_SECRET` ovanför
 * (`ADMIN_INTAKE_URL`/`INTAG_SECRET`, se contact-server.ts). Aldrig anropad
 * direkt av besökarens webbläsare.
 */

const caseStatusRequestSchema = z.object({
  arendenummer: z.string().trim().min(1).max(40),
  epost: z.string().trim().email().max(255),
  turnstileToken: z.string().max(2048).nullable().optional(),
});

type CaseStatusRequestData = ReturnType<typeof caseStatusRequestSchema.parse>;

export interface PubliktArendeStatusSteg {
  nyckel: string;
  etikett: string;
  tidpunkt: string;
}

/** Speglar adminportalens `PubliktArendeStatus`
 *  (lib/admin/publik-statuskoll-server.ts) - samma whitelistade fält, aldrig
 *  id/kund_id/ansvarig/prioritet eller konversationen. */
export interface PubliktArendeStatus {
  arendenummer: string;
  rubrik: string;
  status: string;
  kategori: string;
  skapad: string;
  uppdaterad: string;
  steg: PubliktArendeStatusSteg[];
}

export type CaseStatusResult =
  | { ok: true; funnet: true; arende: PubliktArendeStatus }
  | { ok: true; funnet: false }
  | { ok: false; fel: "turnstile" | "sparrat" | "serverfel" };

const TURNSTILE_ACTION = "arendestatus";
const ALLOWED_TURNSTILE_HOSTNAMES = new Set([
  "nova-it.se",
  "www.nova-it.se",
  "novait.se",
  "www.novait.se",
]);

/**
 * Egen kopia av `contact-server.ts`s Turnstile-verifiering, med en egen
 * `action` ("arendestatus" i stället för "contact") - Cloudflare avvisar
 * annars tokenet eftersom Turnstile binder varje token till den `action` som
 * begärde det. Samma fail-closed-i-produktion-princip.
 */
async function verifieraTurnstile(token: string | null): Promise<void> {
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
        idempotency_key: crypto.randomUUID(),
      }),
      signal: AbortSignal.timeout(8000),
    });
    const result = (await response.json().catch(() => null)) as {
      success?: boolean;
      action?: string;
      hostname?: string;
    } | null;

    if (
      !response.ok ||
      !result?.success ||
      result.action !== TURNSTILE_ACTION ||
      !result.hostname ||
      !ALLOWED_TURNSTILE_HOSTNAMES.has(result.hostname)
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

/**
 * Den ENDA IP-källan som inte går att förfalska från klienten är nova-it.se:s
 * egen Cloudflare-edge - `cf-connecting-ip` på requesten som når VÅR Worker.
 * Den vidarebefordras till adminportalen som `x-forwarded-for` (adminportalens
 * `hamtaKlientIp` läser den som fallback, se publik-statuskoll-server.ts) -
 * utan detta skulle adminportalens per-IP-spärr bara se nova-it.se:s egen
 * utgående Cloudflare-anslutning, delad av ALLA besökare på samma gång.
 *
 * Dynamisk import, samma mönster och skäl som `support-ai-runtime.ts`:
 * `getRequest()` kräver en aktiv serverfunktions-kontext och ett statiskt
 * import av `@tanstack/react-start/server` här skulle annars dras in i varje
 * modul som importerar den här filen, inklusive klientsidans anrop av
 * `lookupCaseStatus` nedan.
 */
async function hamtaBesokarensIp(): Promise<string | null> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for");
  } catch {
    return null;
  }
}

/**
 * Kärnlogiken, en vanlig testbar funktion - se `skickaKontaktforfragan`s
 * kommentar i contact-server.ts för varför den ligger utanför `.handler()`.
 *
 * "Fel e-post för ett giltigt ärendenummer" och "ärendenumret finns inte
 * alls" ger EXAKT samma `{ funnet: false }`-svar härifrån - adminportalens
 * `slaUppArendestatus` gör redan den distinktionen omöjlig att se, den här
 * funktionen lägger inte till någon egen.
 */
export async function sokArendestatus(data: CaseStatusRequestData): Promise<CaseStatusResult> {
  try {
    await verifieraTurnstile(data.turnstileToken ?? null);
  } catch {
    return { ok: false, fel: "turnstile" };
  }

  const statuskollUrl = process.env.ADMIN_INTAKE_URL;
  const statuskollSecret = process.env.STATUSKOLL_SECRET;
  if (!statuskollUrl || !statuskollSecret) {
    console.error(
      "Ärendestatuskollen kan inte köras - ADMIN_INTAKE_URL eller STATUSKOLL_SECRET saknas.",
    );
    return { ok: false, fel: "serverfel" };
  }

  const besokarIp = await hamtaBesokarensIp();

  let response: Response;
  try {
    response = await fetch(`${statuskollUrl}/api/public/arendestatus`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-statuskoll-secret": statuskollSecret,
        "x-statuskoll-timestamp": String(Date.now()),
        "x-statuskoll-nonce": crypto.randomUUID(),
        ...(besokarIp ? { "x-forwarded-for": besokarIp } : {}),
      },
      body: JSON.stringify({ arendenummer: data.arendenummer, epost: data.epost }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.error("Kunde inte nå adminportalen för ärendestatuskollen.", error);
    return { ok: false, fel: "serverfel" };
  }

  if (response.status === 429) {
    await response.body?.cancel().catch(() => undefined);
    return { ok: false, fel: "sparrat" };
  }

  const body = (await response.json().catch(() => null)) as {
    ok?: boolean;
    funnet?: boolean;
    arende?: PubliktArendeStatus;
  } | null;

  if (!response.ok || !body?.ok) {
    console.error("Adminportalen avvisade ärendestatuskollen.", { status: response.status });
    return { ok: false, fel: "serverfel" };
  }

  if (!body.funnet || !body.arende) {
    return { ok: true, funnet: false };
  }

  return { ok: true, funnet: true, arende: body.arende };
}

export const lookupCaseStatus = createServerFn({ method: "POST" })
  .validator(caseStatusRequestSchema)
  .handler(({ data }) => sokArendestatus(data));
