import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";
import { supportFlows } from "./support-data";
import {
  AI_MAX_INDATA,
  byggAnvandarPrompt,
  byggSystemPrompt,
  extraheraModellsvar,
  tolkaAiSvar,
} from "./support-ai";
import type { AiForslag } from "./support-ai";

/**
 * AI-stödd ärendeförståelse via Cloudflare Workers AI.
 *
 * Två anropsvägar, i prioritetsordning:
 *
 *   1. Den native `env.AI`-bindningen (`hamtaAiBindning` nedan), om den
 *      hittas på det inkommande request-objektet. Kräver INGEN hemlighet -
 *      Cloudflare sköter autentiseringen mellan Workern och Workers AI.
 *   2. REST-API:et med en scopad API-token, om bindningen inte hittas men
 *      `CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_AI_TOKEN` är satta. Det är vägen
 *      som fungerar i lokal `vite dev`, där det inte finns någon Cloudflare-
 *      runtime och alltså ingen bindning att hitta.
 *
 * VARFÖR bindningen kan hittas på request-objektet: nitros
 * cloudflare-module-preset skriver `request.runtime.cloudflare.env` på det
 * FAKTISKA inkommande Request-objektet innan det når resten av appen (se
 * `_module-handler.mjs` i `nitro`-paketet). `getRequest()` från
 * `@tanstack/react-start/server` returnerar det objektet inifrån en
 * serverfunktion. Det är alltså inte en TanStack Start-specifik funktion,
 * utan en egenskap som nitro sätter på requesten självt.
 *
 * Detta är INTE fullt verifierat i en riktig deploy från den här miljön -
 * det gick inte att köra `wrangler dev` mot ett riktigt Cloudflare-konto
 * härifrån. Därför faller koden tyst tillbaka till REST-vägen om bindningen
 * av någon anledning inte hittas eller anropet på den kastar - se
 * `docs/supportassistent-ai-drift.md` för hur man bekräftar i efterhand
 * (Cloudflare-loggarna skiljer på "bindning" och "REST" per anrop, se
 * `kalla`-fältet i loggraden nedan, utan att någonsin logga kundens text).
 *
 * VIKTIGT om ansvarsfördelningen: den här funktionen är ett TILLÄGG till
 * regelmotorn i `support-engine.ts`, inte en ersättning. Den returnerar null
 * så fort något går fel - avstängd, saknad konfiguration, timeout, fel,
 * ogiltigt svar - och anropande kod använder då regelmotorn. Guiden ska
 * fungera exakt som idag om AI-tjänsten är nere eller inte är tillgänglig.
 *
 * Kostnadsläge: Cloudflare ger 10 000 Neurons per dygn utan kostnad, oavsett
 * vilken av vägarna som används. Endpointen är publik och oautentiserad. Se
 * `SUPPORT_AI_LAGE` nedan och `docs/supportassistent-ai-drift.md` för
 * missbruksskyddet - det ska lösas med en Rate Limiting-regel i Cloudflare,
 * inte i den här koden.
 */

/**
 * Standardmodell. Liten, snabb och billig i Neurons räknat; uppgiften är
 * klassificering, inte fritt resonemang. Kan bytas utan kodändring.
 *
 * Explicit pinnad till -v2, inte den äldre `@cf/meta/llama-3.2-3b-instruct`.
 * Cloudflare aliasar det äldre namnet tyst till -v2 (bekräftat mot skarpt
 * API 2026-08-16) - att peka rätt direkt är säkrare än att lita på att
 * aliaset finns kvar. Svarsformatet skiljer sig inte: `extraheraModellsvar`
 * hanterar redan både `response` och `choices[].message.content`.
 */
const STANDARDMODELL = "@cf/meta/llama-3.2-3b-instruct-v2";

/** Kunden ska aldrig få vänta på en långsam modell. Hellre falla tillbaka
 *  på regelmotorn direkt än att guiden känns trög. */
const TIMEOUT_MS = 4000;

const fragaSchema = z.object({
  fraga: z.string().trim().min(1).max(AI_MAX_INDATA),
});

export type AiKlassificering = AiForslag | null;

/**
 * Minsta möjliga typ för `env.AI`-bindningen - bara det som faktiskt
 * används. Undviker ett beroende på `@cloudflare/workers-types` bara för en
 * enda metodsignatur.
 */
type WorkersAiBindning = {
  run: (
    modell: string,
    indata: {
      messages: Array<{ role: "system" | "user"; content: string }>;
      temperature: number;
      max_tokens: number;
    },
  ) => Promise<unknown>;
};

/**
 * Läser om AI-stödet är påslaget. Avstängt som standard: funktionen ska
 * kunna ligga i produktion utan att vara aktiv, på samma sätt som
 * `PUBLIK_INTAG_LAGE` (se `features/contact/intag-lage.ts`). Bara det
 * uttryckliga värdet `pa` slår på den.
 */
export function aiArPaslaget(varde: string | undefined): boolean {
  return varde?.trim().toLocaleLowerCase("sv") === "pa";
}

/**
 * Letar efter `env.AI` på det inkommande request-objektet. Returnerar
 * `undefined` om formen inte stämmer, i stället för att kasta - det här
 * anropas i en miljö (lokal dev) där formen ofta helt saknas, och det är ett
 * normalt, förväntat läge, inte ett fel.
 */
/**
 * `createServerOnlyFn` gör två saker som är nödvändiga här: dess innehåll
 * (inklusive den dynamiska importen av `@tanstack/react-start/server`
 * nedan) tas bort helt ur klientbundeln av byggpluginet, och ett
 * klientanrop av misstag kastar direkt i stället för att tyst göra
 * ingenting. `getRequest` kan INTE vara ett statiskt top-level-import i den
 * här filen - `support-ai-server.ts` importeras (via `klassificeraMedAi`)
 * även från `SupportGuide.tsx`, som är klientkod, och ett statiskt import
 * av server-entrypointen fälls då av `importProtection` i `vite.config.ts`
 * (verifierat: bygget stoppade exakt detta första gången).
 */
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
    // getRequest() kräver en aktiv serverfunktions-kontext. Utanför en
    // sådan (t.ex. anropad direkt i ett test) är avsaknad av bindning rätt
    // svar, inte ett fel.
    return undefined;
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

// Exporterad enbart för test: att simulera getRequest()'s beroende på en
// aktiv serverfunktions-kontext är opraktiskt, medan bindningsobjektet
// själv - en `{ run() }`-form - är trivialt att fejka.
export async function klassificeraViaBindning(
  bindning: WorkersAiBindning,
  fraga: string,
  modell: string,
): Promise<AiKlassificering> {
  try {
    const svar = await medTimeout(
      bindning.run(modell, {
        messages: [
          { role: "system", content: byggSystemPrompt(supportFlows) },
          { role: "user", content: byggAnvandarPrompt(fraga) },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    );

    const ratext = extraheraModellsvar(svar);
    if (ratext === null) return null;

    console.log("Supportassistentens AI svarade.", { kalla: "bindning" });
    return tolkaAiSvar(ratext, supportFlows);
  } catch (error) {
    console.error(
      "Workers AI-bindningen kunde inte nås.",
      error instanceof Error ? error.message : "okänt fel",
    );
    return null;
  }
}

async function klassificeraViaRest(fraga: string, modell: string): Promise<AiKlassificering> {
  const kontoId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_AI_TOKEN;

  if (!kontoId || !apiToken) {
    // Ingen bindning hittad OCH REST inte konfigurerat - det är det
    // förväntade läget i lokal `vite dev` utan `.env`, inte ett fel.
    return null;
  }

  try {
    const svar = await medTimeout(
      fetch(`https://api.cloudflare.com/client/v4/accounts/${kontoId}/ai/run/${modell}`, {
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
      }),
    );

    if (!svar.ok) {
      await svar.body?.cancel().catch(() => undefined);
      // Statuskoden loggas, men aldrig kundens text eller token.
      console.error("Workers AI (REST) svarade med fel.", { status: svar.status });
      return null;
    }

    const kropp = (await svar.json().catch(() => null)) as { result?: unknown } | null;

    const ratext = extraheraModellsvar(kropp?.result);
    if (ratext === null) return null;

    console.log("Supportassistentens AI svarade.", { kalla: "rest" });
    return tolkaAiSvar(ratext, supportFlows);
  } catch (error) {
    // Timeout och nätverksfel är förväntade lägen, inte undantagsfall.
    // Kundens text loggas aldrig med felet.
    console.error(
      "Workers AI (REST) kunde inte nås.",
      error instanceof Error ? error.name : "okänt fel",
    );
    return null;
  }
}

export async function klassificeraMedAiInternt(fraga: string): Promise<AiKlassificering> {
  if (!aiArPaslaget(process.env.SUPPORT_AI_LAGE)) return null;

  const modell = process.env.SUPPORT_AI_MODELL || STANDARDMODELL;
  const bindning = await hamtaAiBindning();

  if (bindning) return klassificeraViaBindning(bindning, fraga, modell);
  return klassificeraViaRest(fraga, modell);
}

export const klassificeraMedAi = createServerFn({ method: "POST" })
  .validator(fragaSchema)
  .handler(({ data }) => klassificeraMedAiInternt(data.fraga));
