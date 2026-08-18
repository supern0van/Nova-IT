import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

const getRequestMock = mock(() => ({
  runtime: { cloudflare: { env: budgetMiljo(true) } },
}));
mock.module("@tanstack/react-start/server", () => ({ getRequest: getRequestMock }));

function budgetMiljo(godkant: boolean): { AI_BUDGET_SERVICE: { fetch: typeof fetch } } {
  return {
    AI_BUDGET_SERVICE: {
      fetch: (async () =>
        new Response(JSON.stringify({ ok: godkant }), { status: 200 })) as unknown as typeof fetch,
    },
  };
}

const { chattaInternt, chattAiArPaslaget } = await import("./support-chat-server");

const originalFetch = globalThis.fetch;

function svaraMed(objekt: unknown, status = 200) {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ result: { response: JSON.stringify(objekt) } }), {
      status,
      headers: { "content-type": "application/json" },
    })) as unknown as typeof fetch;
}

beforeEach(() => {
  process.env.SUPPORT_CHAT_LAGE = "pa";
  process.env.CLOUDFLARE_ACCOUNT_ID = "konto123";
  process.env.CLOUDFLARE_AI_TOKEN = "hemlig-token";
  getRequestMock.mockImplementation(() => ({
    runtime: { cloudflare: { env: budgetMiljo(true) } },
  }));
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.SUPPORT_CHAT_LAGE;
  delete process.env.CLOUDFLARE_ACCOUNT_ID;
  delete process.env.CLOUDFLARE_AI_TOKEN;
  delete process.env.SUPPORT_CHAT_MODELL;
});

describe("chattAiArPaslaget", () => {
  test("avstängt som standard, bara 'pa' slår på", () => {
    expect(chattAiArPaslaget(undefined)).toBe(false);
    expect(chattAiArPaslaget("true")).toBe(false);
    expect(chattAiArPaslaget("pa")).toBe(true);
  });
});

describe("chattaInternt", () => {
  test("returnerar ett validerat svar vid korrekt AI-svar", async () => {
    svaraMed({ reply: "Vi kan hjälpa till med det.", urgency: "standard" });
    const resultat = await chattaInternt([{ role: "user", content: "wifi bryts hela tiden" }], 0);
    expect(resultat.ok).toBe(true);
    if (resultat.ok) {
      expect(resultat.svar.reply).toBe("Vi kan hjälpa till med det.");
    }
  });

  test("nekar helt när läget är avstängt, utan att kalla fetch", async () => {
    delete process.env.SUPPORT_CHAT_LAGE;
    let anropad = false;
    globalThis.fetch = (async () => {
      anropad = true;
      throw new Error("ska inte anropas");
    }) as unknown as typeof fetch;

    const resultat = await chattaInternt([{ role: "user", content: "hej" }], 0);
    expect(resultat).toEqual({ ok: false, anledning: "avstangt" });
    expect(anropad).toBe(false);
  });

  test("nekar när den delade budgeten säger nej, utan att kalla fetch", async () => {
    getRequestMock.mockImplementation(() => ({
      runtime: { cloudflare: { env: budgetMiljo(false) } },
    }));
    let anropad = false;
    globalThis.fetch = (async () => {
      anropad = true;
      throw new Error("ska inte anropas");
    }) as unknown as typeof fetch;

    const resultat = await chattaInternt([{ role: "user", content: "hej" }], 0);
    expect(resultat).toEqual({ ok: false, anledning: "budget" });
    expect(anropad).toBe(false);
  });

  test("nekar när sessionens turtak är nått, utan att kalla fetch eller budgeten", async () => {
    let anropad = false;
    globalThis.fetch = (async () => {
      anropad = true;
      throw new Error("ska inte anropas");
    }) as unknown as typeof fetch;

    const resultat = await chattaInternt([{ role: "user", content: "hej" }], 14);
    expect(resultat).toEqual({ ok: false, anledning: "for-manga-turer" });
    expect(anropad).toBe(false);
  });

  test("faller tillbaka till 'fel' vid trasigt AI-svar", async () => {
    globalThis.fetch = (async () => new Response("{}", { status: 500 })) as unknown as typeof fetch;
    const resultat = await chattaInternt([{ role: "user", content: "hej" }], 0);
    expect(resultat).toEqual({ ok: false, anledning: "fel" });
  });

  test("regelmotorns säkerhetsspår vinner alltid, oavsett vad modellen säger", async () => {
    svaraMed({ reply: "Vi tittar på det.", urgency: "standard", securityIncident: false });
    const resultat = await chattaInternt(
      [{ role: "user", content: "jag tror mitt konto kan vara kapat" }],
      0,
    );
    expect(resultat.ok).toBe(true);
    if (resultat.ok) {
      expect(resultat.svar.urgency).toBe("urgent");
      expect(resultat.svar.securityIncident).toBe(true);
    }
  });

  test("modellens högre angelägenhet respekteras när regelmotorn inte flaggat något", async () => {
    svaraMed({ reply: "Det låter allvarligt.", urgency: "priority" });
    const resultat = await chattaInternt([{ role: "user", content: "något krångligt" }], 0);
    expect(resultat.ok).toBe(true);
    if (resultat.ok) {
      expect(resultat.svar.urgency).toBe("priority");
    }
  });
});
