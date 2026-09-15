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
export const harAiBudget = createServerOnlyFn(async (vikt?: number, rateKey?: string): Promise<boolean> => {
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
      body: JSON.stringify({ system: "nova-it", ...(vikt !== undefined ? { vikt } : {}), ...(rateKey ? { rateKey } : {}) }),
      signal: AbortSignal.timeout(2000),
    });
    if (!svar.ok) return false;

    const data = (await svar.json().catch(() => null)) as { ok?: boolean } | null;
    return data?.ok === true;
  } catch {
    return false;
  }
});

/**
 * PUB-1 (fördjupad revision 2026-09-12): per-besökare hastighetsbegränsning
 * för supportchatten via Cloudflares egen `ratelimits`-bindning (se
 * vite.config.ts) - en riktig distribuerad räknare, inte ett manuellt
 * Worker-minnesräkneverk (den typen filens tidigare kommentarer korrekt
 * varnade för). Nyckeln är besökarens `cf-connecting-ip` - samma enda
 * icke-förfalskningsbara IP-källa som `case-status-server.ts` redan
 * använder, av samma skäl (se den filens kommentar).
 *
 * Fail-OPEN vid saknad bindning eller ett oväntat fel - till skillnad från
 * `harAiBudget` ovan (som fail-closar) är det här ett ANDRA, kompletterande
 * skydd ovanpå den delade AI-budgeten; om bindningen någon gång saknas
 * (t.ex. en lokal dev-miljö utan `ratelimits` konfigurerat) ska chatten
 * fortfarande fungera - budgetkontrollen är den skarpa spärren.
 */
export const arChattIpSparrad = createServerOnlyFn(async (): Promise<boolean> => {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest() as unknown as {
      headers: { get(name: string): string | null };
      runtime?: {
        cloudflare?: {
          env?: {
            SUPPORT_CHAT_RATE_LIMITER?: {
              limit: (opts: { key: string }) => Promise<{ success: boolean }>;
            };
          };
        };
      };
    };
    const begransare = request?.runtime?.cloudflare?.env?.SUPPORT_CHAT_RATE_LIMITER;
    if (!begransare) return false;

    const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for");
    if (!ip) return false; // ingen pålitlig nyckel att begränsa på - hellre släppa igenom än att spärra alla bakom samma proxy

    const { success } = await begransare.limit({ key: ip });
    return !success;
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
  // Om `tidsgrans` vinner racet fortsätter `arbete` att köras ospårat i
  // bakgrunden - ingen läser längre dess resultat/avvisning. Utan den här
  // tomma catch:en syns en sen rejection som en unhandled rejection i
  // Workers-loggarna och sudda ut den riktiga timeout-orsaken (granskning
  // 2026-08-25, fynd #5). Anroparna har redan egna try/catch runt hela
  // `medTimeout`-anropet, så detta ändrar inget faktiskt beteende.
  arbete.catch(() => {});
  try {
    return await Promise.race([arbete, tidsgrans]);
  } finally {
    clearTimeout(timeout!);
  }
}
