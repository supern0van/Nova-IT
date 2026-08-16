import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supportFlows } from "./support-data";
import { AI_MAX_INDATA, byggAnvandarPrompt, byggSystemPrompt, tolkaAiSvar } from "./support-ai";
import type { AiForslag } from "./support-ai";

/**
 * AI-stödd ärendeförståelse via Cloudflare Workers AI.
 *
 * Anropas server-side över Workers AI:s REST-API. Bindningsvarianten
 * (`env.AI`) kräver ändringar i det genererade nitro-/wrangler-bygget, medan
 * REST följer exakt samma mönster som webbplatsens övriga externa anrop
 * (Resend, Turnstile, ärendeintaget) och kan testas med mockad fetch.
 *
 * VIKTIGT om ansvarsfördelningen: den här funktionen är ett TILLÄGG till
 * regelmotorn i `support-engine.ts`, inte en ersättning. Den returnerar null
 * så fort något går fel - avstängd, saknad konfiguration, timeout, HTTP-fel,
 * ogiltigt svar - och anropande kod använder då regelmotorn. Guiden ska
 * fungera exakt som idag om AI-tjänsten är nere.
 *
 * Kostnadsläge: Cloudflare ger 10 000 Neurons per dygn utan kostnad. Ett
 * anrop med den här prompten kostar i storleksordningen några få Neurons,
 * men endpointen är publik och oautentiserad. Se `SUPPORT_AI_LAGE` nedan och
 * `docs/supportassistent-ai-drift.md` för missbruksskyddet - det ska lösas
 * med en Rate Limiting-regel i Cloudflare, inte i den här koden.
 */

/** Standardmodell. Liten, snabb och billig i Neurons räknat; uppgiften är
 *  klassificering, inte fritt resonemang. Kan bytas utan kodändring. */
const STANDARDMODELL = "@cf/meta/llama-3.2-3b-instruct";

/** Kunden ska aldrig få vänta på en långsam modell. Hellre falla tillbaka
 *  på regelmotorn direkt än att guiden känns trög. */
const TIMEOUT_MS = 4000;

const fragaSchema = z.object({
  fraga: z.string().trim().min(1).max(AI_MAX_INDATA),
});

export type AiKlassificering = AiForslag | null;

/**
 * Läser om AI-stödet är påslaget. Avstängt som standard: funktionen ska
 * kunna ligga i produktion utan att vara aktiv, på samma sätt som
 * `PUBLIK_INTAG_LAGE` (se `features/contact/intag-lage.ts`). Bara det
 * uttryckliga värdet `pa` slår på den.
 */
export function aiArPaslaget(varde: string | undefined): boolean {
  return varde?.trim().toLocaleLowerCase("sv") === "pa";
}

export async function klassificeraMedAiInternt(fraga: string): Promise<AiKlassificering> {
  if (!aiArPaslaget(process.env.SUPPORT_AI_LAGE)) return null;

  const kontoId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_AI_TOKEN;
  const modell = process.env.SUPPORT_AI_MODELL || STANDARDMODELL;

  if (!kontoId || !apiToken) {
    console.error("Supportassistentens AI saknar CLOUDFLARE_ACCOUNT_ID eller CLOUDFLARE_AI_TOKEN.");
    return null;
  }

  const avbrytare = new AbortController();
  const timeout = setTimeout(() => avbrytare.abort(), TIMEOUT_MS);

  try {
    const svar = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${kontoId}/ai/run/${modell}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: byggSystemPrompt(supportFlows) },
            { role: "user", content: byggAnvandarPrompt(fraga) },
          ],
          // Låg temperatur: uppgiften är att sortera konsekvent, inte att
          // formulera sig varierat. max_tokens räcker för JSON-objektet.
          temperature: 0.1,
          max_tokens: 200,
        }),
        signal: avbrytare.signal,
      },
    );

    if (!svar.ok) {
      await svar.body?.cancel().catch(() => undefined);
      // Statuskoden loggas, men aldrig kundens text eller token.
      console.error("Workers AI svarade med fel.", { status: svar.status });
      return null;
    }

    const kropp = (await svar.json().catch(() => null)) as {
      result?: { response?: unknown };
    } | null;

    const ratext = kropp?.result?.response;
    if (typeof ratext !== "string") return null;

    return tolkaAiSvar(ratext, supportFlows);
  } catch (error) {
    // Timeout och nätverksfel är förväntade lägen, inte undantagsfall.
    // Kundens text loggas aldrig med felet.
    console.error("Workers AI kunde inte nås.", error instanceof Error ? error.name : "okänt fel");
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export const klassificeraMedAi = createServerFn({ method: "POST" })
  .validator(fragaSchema)
  .handler(({ data }) => klassificeraMedAiInternt(data.fraga));
