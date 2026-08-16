import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { aiArPaslaget, klassificeraMedAiInternt } from "./support-ai-server";

const originalFetch = globalThis.fetch;

function svaraMed(text: string, status = 200) {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ result: { response: text } }), {
      status,
      headers: { "content-type": "application/json" },
    })) as unknown as typeof fetch;
}

beforeEach(() => {
  process.env.SUPPORT_AI_LAGE = "pa";
  process.env.CLOUDFLARE_ACCOUNT_ID = "konto123";
  process.env.CLOUDFLARE_AI_TOKEN = "hemlig-token";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.SUPPORT_AI_LAGE;
  delete process.env.CLOUDFLARE_ACCOUNT_ID;
  delete process.env.CLOUDFLARE_AI_TOKEN;
  delete process.env.SUPPORT_AI_MODELL;
});

describe("AI-lägets omkopplare", () => {
  test("är avstängt som standard och slås på bara av ett uttryckligt värde", () => {
    expect(aiArPaslaget(undefined)).toBe(false);
    expect(aiArPaslaget("")).toBe(false);
    expect(aiArPaslaget("true")).toBe(false);
    expect(aiArPaslaget("av")).toBe(false);
    expect(aiArPaslaget("pa")).toBe(true);
    expect(aiArPaslaget("  PA  ")).toBe(true);
  });
});

describe("klassificering via Workers AI", () => {
  test("returnerar ett validerat förslag vid korrekt svar", async () => {
    svaraMed('{"flowId":"wifi","urgency":"priority","tolkning":"Nätet bryts."}');
    const forslag = await klassificeraMedAiInternt("wifi bryts hela tiden");
    expect(forslag).toEqual({ flowId: "wifi", urgency: "priority", tolkning: "Nätet bryts." });
  });

  test("anropar inte AI-tjänsten alls när läget är avstängt", async () => {
    delete process.env.SUPPORT_AI_LAGE;
    let anropad = false;
    globalThis.fetch = (async () => {
      anropad = true;
      throw new Error("ska inte anropas");
    }) as unknown as typeof fetch;

    expect(await klassificeraMedAiInternt("wifi krånglar")).toBeNull();
    expect(anropad).toBe(false);
  });

  test("anropar inte AI-tjänsten när konfigurationen är ofullständig", async () => {
    delete process.env.CLOUDFLARE_AI_TOKEN;
    let anropad = false;
    globalThis.fetch = (async () => {
      anropad = true;
      throw new Error("ska inte anropas");
    }) as unknown as typeof fetch;

    expect(await klassificeraMedAiInternt("wifi krånglar")).toBeNull();
    expect(anropad).toBe(false);
  });

  test("faller tillbaka tyst vid HTTP-fel", async () => {
    globalThis.fetch = (async () => new Response("{}", { status: 429 })) as unknown as typeof fetch;
    expect(await klassificeraMedAiInternt("wifi krånglar")).toBeNull();
  });

  test("faller tillbaka tyst när nätverket fallerar", async () => {
    globalThis.fetch = (async () => {
      throw new Error("connection refused at 10.0.0.5");
    }) as unknown as typeof fetch;
    expect(await klassificeraMedAiInternt("wifi krånglar")).toBeNull();
  });

  test("faller tillbaka när modellen hittar på en kategori", async () => {
    svaraMed('{"flowId":"root-access","urgency":"urgent","tolkning":"x"}');
    expect(await klassificeraMedAiInternt("wifi krånglar")).toBeNull();
  });

  test("skickar aldrig API-token till någon annan värd än Cloudflare", async () => {
    let anropadUrl = "";
    let hadeToken = false;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      anropadUrl = String(input);
      hadeToken = String((init?.headers as Record<string, string>)?.Authorization ?? "").includes(
        "hemlig-token",
      );
      return new Response(JSON.stringify({ result: { response: '{"flowId":"wifi"}' } }), {
        status: 200,
      });
    }) as unknown as typeof fetch;

    await klassificeraMedAiInternt("wifi krånglar");
    expect(anropadUrl.startsWith("https://api.cloudflare.com/client/v4/accounts/konto123/")).toBe(
      true,
    );
    expect(hadeToken).toBe(true);
  });
});
