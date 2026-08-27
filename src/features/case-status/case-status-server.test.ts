import { afterEach, beforeEach, expect, test } from "bun:test";
import { sokArendestatus } from "./case-status-server";

const ENV_KEYS = [
  "ADMIN_INTAKE_URL",
  "STATUSKOLL_SECRET",
  "TURNSTILE_SECRET_KEY",
  "TURNSTILE_REQUIRED",
  "NODE_ENV",
] as const;

const originalEnv: Record<string, string | undefined> = {};
let originalFetch: typeof fetch;

beforeEach(() => {
  for (const key of ENV_KEYS) originalEnv[key] = process.env[key];
  process.env.ADMIN_INTAKE_URL = "https://admin.nova-it.se";
  process.env.STATUSKOLL_SECRET = "test-statuskoll-hemlighet";
  delete process.env.TURNSTILE_SECRET_KEY; // default: ej konfigurerad (soft-fail utanför produktion)
  delete process.env.TURNSTILE_REQUIRED;
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
  globalThis.fetch = originalFetch;
});

const giltigForfragan = {
  arendenummer: "NIT-2601",
  epost: "anna@example.se",
  turnstileToken: null as string | null,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  }) as Response;
}

test("returnerar ärendet vid en träff", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return jsonResponse({
      ok: true,
      funnet: true,
      arende: {
        arendenummer: "NIT-2601",
        rubrik: "Datorn startar inte",
        status: "pagaende",
        kategori: "datorer_vardags_it",
        skapad: "2026-08-01T10:00:00.000Z",
        uppdaterad: "2026-08-20T10:00:00.000Z",
        steg: [],
      },
    });
  }) as unknown as typeof fetch;

  const resultat = await sokArendestatus(giltigForfragan);

  expect(resultat).toEqual({
    ok: true,
    funnet: true,
    arende: {
      arendenummer: "NIT-2601",
      rubrik: "Datorn startar inte",
      status: "pagaende",
      kategori: "datorer_vardags_it",
      skapad: "2026-08-01T10:00:00.000Z",
      uppdaterad: "2026-08-20T10:00:00.000Z",
      steg: [],
    },
  });

  expect(calls.length).toBe(1);
  expect(calls[0]?.url).toBe("https://admin.nova-it.se/api/public/arendestatus");
  const headers = new Headers(calls[0]?.init?.headers);
  expect(headers.get("x-statuskoll-secret")).toBe("test-statuskoll-hemlighet");
  expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({
    arendenummer: "NIT-2601",
    epost: "anna@example.se",
  });
});

test("ger `funnet: false` för fel e-post eller obefintligt ärendenummer, utan att skilja dem åt", async () => {
  globalThis.fetch = (async () =>
    jsonResponse({ ok: true, funnet: false })) as unknown as typeof fetch;

  const resultat = await sokArendestatus(giltigForfragan);

  expect(resultat).toEqual({ ok: true, funnet: false });
});

test("returnerar `sparrat` vid 429 från adminportalen", async () => {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ ok: false, sparrad: true }), {
      status: 429,
      headers: { "content-type": "application/json" },
    })) as unknown as typeof fetch;

  const resultat = await sokArendestatus(giltigForfragan);

  expect(resultat).toEqual({ ok: false, fel: "sparrat" });
});

test("returnerar `serverfel` utan att anropa adminportalen om konfiguration saknas", async () => {
  delete process.env.STATUSKOLL_SECRET;
  let anropad = false;
  globalThis.fetch = (async () => {
    anropad = true;
    return jsonResponse({ ok: true, funnet: false });
  }) as unknown as typeof fetch;

  const resultat = await sokArendestatus(giltigForfragan);

  expect(resultat).toEqual({ ok: false, fel: "serverfel" });
  expect(anropad).toBe(false);
});

test("returnerar `serverfel` när adminportalen inte kan nås", async () => {
  globalThis.fetch = (async () => {
    throw new Error("nätverksfel");
  }) as unknown as typeof fetch;

  const resultat = await sokArendestatus(giltigForfragan);

  expect(resultat).toEqual({ ok: false, fel: "serverfel" });
});

test("returnerar `serverfel` när adminportalen svarar med ett oväntat fel", async () => {
  globalThis.fetch = (async () => jsonResponse({ ok: false }, 500)) as unknown as typeof fetch;

  const resultat = await sokArendestatus(giltigForfragan);

  expect(resultat).toEqual({ ok: false, fel: "serverfel" });
});

test("kräver ett Turnstile-token i produktion, utan att anropa adminportalen", async () => {
  process.env.NODE_ENV = "production";
  process.env.TURNSTILE_SECRET_KEY = "test-turnstile-secret";
  let anropad = false;
  globalThis.fetch = (async () => {
    anropad = true;
    return jsonResponse({ ok: true, funnet: false });
  }) as unknown as typeof fetch;

  const resultat = await sokArendestatus(giltigForfragan);

  expect(resultat).toEqual({ ok: false, fel: "turnstile" });
  expect(anropad).toBe(false);
});

test("skickar Turnstile-svaret till siteverify med rätt action och avvisar fel action", async () => {
  process.env.TURNSTILE_SECRET_KEY = "test-turnstile-secret";
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push(url);
    if (url.includes("challenges.cloudflare.com")) {
      const body = JSON.parse(String(init?.body));
      expect(body.response).toBe("ett-token");
      return jsonResponse({ success: true, action: "fel-action", hostname: "nova-it.se" });
    }
    return jsonResponse({ ok: true, funnet: false });
  }) as unknown as typeof fetch;

  const resultat = await sokArendestatus({ ...giltigForfragan, turnstileToken: "ett-token" });

  expect(resultat).toEqual({ ok: false, fel: "turnstile" });
  expect(calls.some((url) => url.includes("challenges.cloudflare.com"))).toBe(true);
  expect(calls.some((url) => url.includes("/api/public/arendestatus"))).toBe(false);
});
