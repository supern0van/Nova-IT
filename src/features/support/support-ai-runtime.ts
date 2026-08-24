import { createServerOnlyFn } from "@tanstack/react-start";

/**
 * Delad Cloudflare Workers AI-körtid för både den gamla klassificeraren
 * (`support-ai-server.ts`) och den fria chatten (`support-chat-server.ts`).
 * Bröts ut hit eftersom båda filerna hade praktiskt taget identisk kod för
 * att hitta `env.AI`-bindningen och fråga den delade AI-budgeten - samma
 * mönster, kopierat i stället för delat.
 *
 * Se `support-ai-server.ts`s huvudkommentar för den fulla förklaringen av
 * VARFÖR bindningen letas upp så här (nitros cloudflare-module-preset,
 * `request.runtime.cloudflare.env`) och varför `createServerOnlyFn` krävs
 * (statiskt import av `@tanstack/react-start/server` fälls av
 * `importProtection` i vite.config.ts eftersom denna fil även når klientkod
 * via `SupportGuide.tsx`).
 */

/**
 * Minsta möjliga typ för `env.AI`-bindningen - bara det som faktiskt
 * används. Rollunionen är den bredare av de två anroparnas behov
 * (klassificeraren skickar bara system/user, chatten skickar även
 * assistant-historik) - ett smalare anrop är alltid giltigt mot en bredare
 * typ, så en enda delad typ täcker båda.
 */
export type WorkersAiBindning = {
  run: (
    modell: string,
    indata: {
      messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
      temperature: number;
      max_tokens: number;
    },
  ) => Promise<unknown>;
};

export const hamtaAiBindning = createServerOnlyFn(
  async (): Promise<WorkersAiBindning | undefined> => {
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
  },
);

/**
 * Frågar den delade AI-budgeten (Nova-IT-Portaler/ai-budget/, en Durable
 * Object som ALLA tre portaler delar) om det är okej att göra ett AI-anrop
 * just nu. Samma Service Binding-mönster som `hamtaAiBindning` ovan.
 *
 * `vikt` är antalet `RESERVATION_PER_ANROP`-enheter anropet reserverar (se
 * `Nova-IT-Portaler/ai-budget/src/rakna.ts`) - utelämnas den, avgör
 * budgettjänsten själv standardvikten (den gamla klassificeraren skickar
 * ingen, den fria chatten skickar en högre explicit vikt eftersom den kostar
 * väsentligt mer per anrop).
 *
 * Svarar `false` vid MINSTA osäkerhet - saknad bindning, timeout, ett
 * felaktigt svar - eftersom "vi vet inte" ska tolkas som "gör inte anropet",
 * aldrig tvärtom.
 */
export const harAiBudget = createServerOnlyFn(async (vikt?: number): Promise<boolean> => {
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
      body: JSON.stringify({ system: "nova-it", ...(vikt !== undefined ? { vikt } : {}) }),
      signal: AbortSignal.timeout(2000),
    });
    if (!svar.ok) return false;

    const data = (await svar.json().catch(() => null)) as { ok?: boolean } | null;
    return data?.ok === true;
  } catch {
    return false;
  }
});

/** Kapar `arbete` vid `timeoutMs` - de två anroparna har olika gränser
 *  (klassificeraren 4000ms, chatten 9000ms eftersom den skickar mer
 *  underlag och väntar på ett längre svar), så gränsen är en parameter
 *  här, inte en modulnivå-konstant. */
export async function medTimeout<T>(arbete: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout>;
  const tidsgrans = new Promise<never>((_, avvisa) => {
    timeout = setTimeout(() => avvisa(new Error("timeout")), timeoutMs);
  });
  try {
    return await Promise.race([arbete, tidsgrans]);
  } finally {
    clearTimeout(timeout!);
  }
}
