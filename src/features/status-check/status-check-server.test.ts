import { afterEach, beforeEach, expect, test } from "bun:test";
import { slaUppArendestatus } from "./status-check-server";

// Samma hjälpare som contact-server.test.ts - `url.includes("host")` flaggas
// av CodeQL som en ofullständig URL-substrångskontroll (godtyckliga hostnamn
// kan innehålla strängen före/efter). Riktig URL-parsning i stället.
function hasExpectedHttpsHost(rawUrl: string, expectedHostname: string): boolean {
  try {
    const parsedUrl = new URL(rawUrl);
    return parsedUrl.protocol === "https:" && parsedUrl.hostname === expectedHostname;
  } catch {
    return false;
  }
}

const ENV_KEYS = ["ADMIN_INTAKE_URL", "STATUSKOLL_SECRET", "TURNSTILE_SECRET_KEY", "TURNSTILE_REQUIRED"] as const;

const originalEnv: Record<string, string | undefined> = {};
let originalFetch: typeof fetch;

beforeEach(() => {
  for (const key of ENV_KEYS) originalEnv[key] = process.env[key];
  process.env.ADMIN_INTAKE_URL = "https://admin.nova-it.se";
  process.env.STATUSKOLL_SECRET = "test-hemlighet";
  delete process.env.TURNSTILE_SECRET_KEY; // default: ej konfigurerad (soft-fail)
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

const validPayload = {
  ticketNumber: "NIT-2601",
  email: "anna@example.se",
  website: "",
  formRenderedAt: Date.now() - 5_000,
  turnstileToken: null as string | null,
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  }) as Response & { ok: boolean };
}

test("slår upp status via adminportalens statuskollsendpoint med rätt hemlighet", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    return jsonResponse({
      ok: true,
      funnet: true,
      arende: {
        arendenummer: "NIT-2601",
        rubrik: "Datorn startar inte",
        status: "pagaende",
        kategori: "datorer_vardags_it",
        skapad: "2026-08-01T10:00:00.000Z",
        uppdaterad: "2026-08-02T10:00:00.000Z",
        steg: [],
      },
    });
  }) as unknown as typeof fetch;

  const result = await slaUppArendestatus(validPayload);

  expect(result).toEqual({
    funnet: true,
    arende: {
      arendenummer: "NIT-2601",
      rubrik: "Datorn startar inte",
      status: "pagaende",
      kategori: "datorer_vardags_it",
      skapad: "2026-08-01T10:00:00.000Z",
      uppdaterad: "2026-08-02T10:00:00.000Z",
      steg: [],
    },
  });

  expect(calls).toHaveLength(1);
  expect(calls[0]?.url).toBe("https://admin.nova-it.se/api/public/arendestatus");
  expect(calls[0]?.init?.headers).toMatchObject({ "x-statuskoll-secret": "test-hemlighet" });
  expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({
    arendenummer: "NIT-2601",
    epost: "anna@example.se",
  });
});

test("returnerar funnet:false utan att kasta fel vid fel e-post/obefintligt ärende", async () => {
  globalThis.fetch = (async () => jsonResponse({ ok: true, funnet: false })) as unknown as typeof fetch;

  const result = await slaUppArendestatus(validPayload);

  expect(result).toEqual({ funnet: false });
});

test("kastar ett vänligt fel vid 429 (rate-limit)", async () => {
  globalThis.fetch = (async () => jsonResponse({ ok: false }, false, 429)) as unknown as typeof fetch;

  await expect(slaUppArendestatus(validPayload)).rejects.toThrow(/många uppslag/i);
});

test("kastar ett generiskt fel utan att läcka statuskod vid ett annat backend-fel", async () => {
  globalThis.fetch = (async () => jsonResponse({ ok: false }, false, 500)) as unknown as typeof fetch;

  await expect(slaUppArendestatus(validPayload)).rejects.toThrow();
});

test("avvisar honeypot-ifyllda förfrågningar utan nätverksanrop", async () => {
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    throw new Error("should not be called");
  }) as unknown as typeof fetch;

  await expect(slaUppArendestatus({ ...validPayload, website: "http://spam.example" })).rejects.toThrow();
  expect(called).toBe(false);
});

test("avvisar förfrågningar som skickas orimligt snabbt efter rendering", async () => {
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    throw new Error("should not be called");
  }) as unknown as typeof fetch;

  await expect(
    slaUppArendestatus({ ...validPayload, formRenderedAt: Date.now() }),
  ).rejects.toThrow();
  expect(called).toBe(false);
});

test("skips Turnstile verification locally when it is not configured", async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (hasExpectedHttpsHost(String(input), "challenges.cloudflare.com")) {
      throw new Error("Turnstile should not be called when unconfigured");
    }
    return jsonResponse({ ok: true, funnet: false });
  }) as unknown as typeof fetch;

  await expect(slaUppArendestatus(validPayload)).resolves.toEqual({ funnet: false });
});

test("fails closed when Turnstile is required but its secret is missing", async () => {
  process.env.TURNSTILE_REQUIRED = "true";
  globalThis.fetch = (async () => {
    throw new Error("should not reach the statuskoll endpoint without Turnstile configuration");
  }) as unknown as typeof fetch;

  await expect(slaUppArendestatus(validPayload)).rejects.toThrow();
});

test("rejects when Turnstile is configured but no token was provided", async () => {
  process.env.TURNSTILE_SECRET_KEY = "test-turnstile-secret";

  await expect(
    slaUppArendestatus({ ...validPayload, turnstileToken: null }),
  ).rejects.toThrow();
});

test("uses its own 'statuskoll' action, distinct from the contact form's 'contact'", async () => {
  process.env.TURNSTILE_SECRET_KEY = "test-turnstile-secret";
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (hasExpectedHttpsHost(url, "challenges.cloudflare.com")) {
      return jsonResponse({ success: true, action: "statuskoll", hostname: "nova-it.se" });
    }
    return jsonResponse({ ok: true, funnet: false });
  }) as unknown as typeof fetch;

  const result = await slaUppArendestatus({ ...validPayload, turnstileToken: "valid-token" });

  expect(result).toEqual({ funnet: false });
  const turnstileCall = calls.find((call) => hasExpectedHttpsHost(call.url, "challenges.cloudflare.com"));
  expect(JSON.parse(String(turnstileCall?.init?.body)).response).toBe("valid-token");
});

test("rejects when Cloudflare reports a mismatched action", async () => {
  process.env.TURNSTILE_SECRET_KEY = "test-turnstile-secret";
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (hasExpectedHttpsHost(String(input), "challenges.cloudflare.com")) {
      return jsonResponse({ success: true, action: "contact", hostname: "nova-it.se" });
    }
    throw new Error("should not reach the statuskoll endpoint");
  }) as unknown as typeof fetch;

  await expect(
    slaUppArendestatus({ ...validPayload, turnstileToken: "wrong-action-token" }),
  ).rejects.toThrow();
});
