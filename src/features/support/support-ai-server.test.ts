import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  aiArPaslaget,
  klassificeraMedAiInternt,
  klassificeraViaBindning,
} from "./support-ai-server";

const originalFetch = globalThis.fetch;

function svaraMed(text: string, status = 200) {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ result: { response: text } }), {
      status,
      headers: { "content-type": "application/json" },
    })) as unknown as typeof fetch;
}

// Formen Workers AI faktiskt skickade i produktion 2026-08-16: `response`
// redan uppackat till ett objekt, inte en JSON-sträng. Se NOVA-0044.
function svaraMedUppackatObjekt(objekt: unknown, status = 200) {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ result: { response: objekt } }), {
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

  // Regression för det verkliga skarpa felet 2026-08-16: AI-stödet
  // aktiverades i produktion men gav alltid null, trots att Workers AI
  // svarade helt korrekt - modellens svar var redan uppackat till ett
  // objekt i stället för en JSON-sträng. Se NOVA-0044.
  test("klassificerar korrekt även när Workers AI redan packat upp response till ett objekt", async () => {
    svaraMedUppackatObjekt({
      flowId: "slow-computer",
      urgency: "standard",
      tolkning: "Datorn är seg med många flikar öppna.",
    });
    const forslag = await klassificeraMedAiInternt("datorn kraschar med massa flikar öppna");
    expect(forslag).toEqual({
      flowId: "slow-computer",
      urgency: "standard",
      tolkning: "Datorn är seg med många flikar öppna.",
    });
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

describe("klassificering via den native bindningen", () => {
  test("returnerar ett validerat förslag och kallar aldrig fetch", async () => {
    let fetchAnropad = false;
    globalThis.fetch = (async () => {
      fetchAnropad = true;
      throw new Error("ska inte anropas");
    }) as unknown as typeof fetch;

    const fejkBindning = {
      run: async () => ({ response: '{"flowId":"wifi","urgency":"standard","tolkning":"x"}' }),
    };

    const forslag = await klassificeraViaBindning(fejkBindning, "wifi krånglar", "modell-x");
    expect(forslag).toEqual({ flowId: "wifi", urgency: "standard", tolkning: "x" });
    expect(fetchAnropad).toBe(false);
  });

  test("klassificerar korrekt när bindningen redan packat upp response till ett objekt", async () => {
    const fejkBindning = {
      run: async () => ({
        response: { flowId: "wifi", urgency: "priority", tolkning: "Nätet bryts under möten." },
      }),
    };
    const forslag = await klassificeraViaBindning(fejkBindning, "wifi krånglar", "modell-x");
    expect(forslag).toEqual({
      flowId: "wifi",
      urgency: "priority",
      tolkning: "Nätet bryts under möten.",
    });
  });

  test("faller tillbaka till null när bindningen kastar", async () => {
    const fejkBindning = {
      run: async () => {
        throw new Error("Workers AI internal error");
      },
    };
    expect(await klassificeraViaBindning(fejkBindning, "wifi krånglar", "modell-x")).toBeNull();
  });

  test("faller tillbaka till null vid ett ogiltigt svar från bindningen", async () => {
    const fejkBindning = { run: async () => ({ response: 42 }) };
    expect(await klassificeraViaBindning(fejkBindning, "wifi krånglar", "modell-x")).toBeNull();
  });

  test("respekterar timeouten även för bindningsvägen", async () => {
    const fejkBindning = {
      run: () => new Promise(() => {}), // löser sig aldrig
    };
    const start = Date.now();
    const forslag = await klassificeraViaBindning(fejkBindning, "wifi krånglar", "modell-x");
    expect(forslag).toBeNull();
    expect(Date.now() - start).toBeLessThan(4500);
  });
});
