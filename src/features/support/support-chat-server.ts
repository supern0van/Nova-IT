import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";
import { classifySupportQuery } from "./support-engine";
import { hamtaRelevantaDokument } from "./support-knowledge";
import {
  byggChattMeddelanden,
  byggChattSystemPrompt,
  extraheraModellsvar,
  MAX_MESSAGE_CHARS,
  MAX_TOTAL_CHARS,
  MAX_TURNS,
  tolkaChattSvar,
  type ChatMessage,
  type ChatSvar,
} from "./support-chat";
import { resolveUrgency } from "./support-tools";

/**
 * AI-motorn för den fria supportchatten via Cloudflare Workers AI.
 *
 * Samma tekniska mönster som `support-ai-server.ts` (bindning-först,
 * REST-fallback, avstängt som standard, delad budget kollas FÖRST och
 * fail-closed) - se den filens kommentarer för varför. Det som skiljer sig:
 *
 * - Flerturs-historik skickas med i varje anrop (stateless - ingen
 *   konversation lagras server-side, se docs/changes för resonemanget).
 * - Budgeten reserveras med en VIKT (`CHAT_BUDGET_VIKT`) eftersom ett
 *   chattanrop - systemprompt + RAG-underlag + återskickad historik - kostar
 *   väsentligt mer än den gamla enstaka klassificeringen. Se
 *   `Nova-IT-Portaler/ai-budget/src/rakna.ts`.
 * - Modellens `urgency`/`securityIncident` är bara EN SIGNAL. Den
 *   nyckelordsbaserade regelmotorn (`classifySupportQuery`) körs alltid på
 *   kundens senaste meddelande och vinner alltid vid säkerhetslarm - modellen
 *   kan höja angelägenhetsgraden, aldrig sänka den regelmotorn redan satt.
 *   Se `resolveUrgency` i `support-tools.ts`.
 *
 * Egen flagga (`SUPPORT_CHAT_LAGE`), separat från den gamla klassificerarens
 * `SUPPORT_AI_LAGE`, så att de kan slås på/av oberoende av varandra under
 * utrullning.
 */

const STANDARDMODELL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const TIMEOUT_MS = 9000;
/** Se `Nova-IT-Portaler/ai-budget/src/rakna.ts` - hur många
 *  `RESERVATION_PER_ANROP`-enheter ETT chattanrop reserverar. En enstaka
 *  klassificering (den gamla motorn) kostade uppmätt ~2-8 Neurons; ett
 *  chattanrop med systemprompt + RAG-underlag + historik är betydligt dyrare
 *  - 4x är en medveten överskattning hellre än en underskattning. */
const CHAT_BUDGET_VIKT = 4;

const meddelandeSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
});

const chattSchema = z.object({
  meddelanden: z.array(meddelandeSchema).min(1).max(MAX_TURNS),
  sessionsTurer: z.number().int().min(0).max(MAX_TURNS),
});

export type ChatResultat =
  | { ok: true; svar: ChatSvar }
  | { ok: false; anledning: "avstangt" | "budget" | "for-manga-turer" | "fel" };

type WorkersAiBindning = {
  run: (
    modell: string,
    indata: {
      messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
      temperature: number;
      max_tokens: number;
    },
  ) => Promise<unknown>;
};

export function chattAiArPaslaget(varde: string | undefined): boolean {
  return varde?.trim().toLocaleLowerCase("sv") === "pa";
}

const hamtaAiBindning = createServerOnlyFn(async (): Promise<WorkersAiBindning | undefined> => {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest() as unknown as {
      runtime?: { cloudflare?: { env?: { AI?: unknown } } };
    };
    const ai = request?.runtime?.cloudflare?.env?.AI;
    return typeof ai === "object" && ai !== null && "run" in ai && typeof ai.run === "function"
      ? (ai as WorkersAiBindning)
      : undefined;
  } catch {
    return undefined;
  }
});

const harAiBudget = createServerOnlyFn(async (): Promise<boolean> => {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest() as unknown as {
      runtime?: { cloudflare?: { env?: { AI_BUDGET_SERVICE?: { fetch: typeof fetch } } } };
    };
    const tjanst = request?.runtime?.cloudflare?.env?.AI_BUDGET_SERVICE;
    if (!tjanst) return false;

    const svar = await tjanst.fetch("https://internal/reservera", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ system: "nova-it", vikt: CHAT_BUDGET_VIKT }),
      signal: AbortSignal.timeout(2000),
    });
    if (!svar.ok) return false;

    const data = (await svar.json().catch(() => null)) as { ok?: boolean } | null;
    return data?.ok === true;
  } catch {
    return false;
  }
});

async function medTimeout<T>(arbete: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout>;
  const tidsgrans = new Promise<never>((_, avvisa) => {
    timeout = setTimeout(() => avvisa(new Error("timeout")), TIMEOUT_MS);
  });
  try {
    return await Promise.race([arbete, tidsgrans]);
  } finally {
    clearTimeout(timeout!);
  }
}

function totalLangd(meddelanden: ChatMessage[]): number {
  return meddelanden.reduce((sum, msg) => sum + msg.content.length, 0);
}

async function anropaViaBindning(
  bindning: WorkersAiBindning,
  systemPrompt: string,
  meddelanden: ChatMessage[],
  modell: string,
): Promise<string | null> {
  try {
    const svar = await medTimeout(
      bindning.run(modell, {
        messages: [{ role: "system", content: systemPrompt }, ...meddelanden],
        temperature: 0.3,
        max_tokens: 500,
      }),
    );
    return extraheraModellsvar(svar);
  } catch (error) {
    console.error(
      "Supportchattens Workers AI-bindning kunde inte nås.",
      error instanceof Error ? error.message : "okänt fel",
    );
    return null;
  }
}

async function anropaViaRest(
  systemPrompt: string,
  meddelanden: ChatMessage[],
  modell: string,
): Promise<string | null> {
  const kontoId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_AI_TOKEN;
  if (!kontoId || !apiToken) return null;

  try {
    const svar = await medTimeout(
      fetch(`https://api.cloudflare.com/client/v4/accounts/${kontoId}/ai/run/${modell}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiToken}`, "content-type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "system", content: systemPrompt }, ...meddelanden],
          temperature: 0.3,
          max_tokens: 500,
        }),
      }),
    );
    if (!svar.ok) {
      await svar.body?.cancel().catch(() => undefined);
      console.error("Supportchattens Workers AI (REST) svarade med fel.", { status: svar.status });
      return null;
    }
    const kropp = (await svar.json().catch(() => null)) as { result?: unknown } | null;
    return extraheraModellsvar(kropp?.result);
  } catch (error) {
    console.error(
      "Supportchattens Workers AI (REST) kunde inte nås.",
      error instanceof Error ? error.name : "okänt fel",
    );
    return null;
  }
}

export async function chattaInternt(
  meddelanden: ChatMessage[],
  sessionsTurer: number,
): Promise<ChatResultat> {
  if (!chattAiArPaslaget(process.env.SUPPORT_CHAT_LAGE))
    return { ok: false, anledning: "avstangt" };

  // Server-sidan är den enda kontroll som faktiskt går att lita på - klienten
  // skickar med sin egen turräkning, men en klient som ljuger om den stoppas
  // ändå här. Detta är INTE ett ersättning för riktig hastighetsbegränsning
  // per IP vid kanten (se docs/changes) - bara ett tak på en enskild sessions
  // längd, oavsett vem som frågar.
  if (sessionsTurer >= MAX_TURNS || totalLangd(meddelanden) > MAX_TOTAL_CHARS) {
    return { ok: false, anledning: "for-manga-turer" };
  }

  if (!(await harAiBudget())) return { ok: false, anledning: "budget" };

  const senasteFraga = [...meddelanden].reverse().find((msg) => msg.role === "user")?.content ?? "";
  const regelmotorResultat = classifySupportQuery(senasteFraga);
  const dokument = hamtaRelevantaDokument(senasteFraga);
  const systemPrompt = byggChattSystemPrompt(
    dokument,
    `${regelmotorResultat.flow.title} (angelägenhet: ${regelmotorResultat.urgency})`,
  );
  const skickadeMeddelanden = byggChattMeddelanden(meddelanden);

  const modell = process.env.SUPPORT_CHAT_MODELL || STANDARDMODELL;
  const bindning = await hamtaAiBindning();
  const ratext = bindning
    ? await anropaViaBindning(bindning, systemPrompt, skickadeMeddelanden, modell)
    : await anropaViaRest(systemPrompt, skickadeMeddelanden, modell);

  if (ratext === null) return { ok: false, anledning: "fel" };

  const tolkat = tolkaChattSvar(ratext, dokument.length);
  if (!tolkat) return { ok: false, anledning: "fel" };

  // Regelmotorns säkerhetsspår vinner alltid - se `resolveUrgency` och
  // motiveringen i filens huvudkommentar.
  const urgency = resolveUrgency(regelmotorResultat.urgency, tolkat.urgency);
  const securityIncident = tolkat.securityIncident || regelmotorResultat.urgency === "urgent";

  return {
    ok: true,
    svar: { ...tolkat, urgency, securityIncident },
  };
}

export const chattaMedAi = createServerFn({ method: "POST" })
  .validator(chattSchema)
  .handler(({ data }) => chattaInternt(data.meddelanden as ChatMessage[], data.sessionsTurer));
