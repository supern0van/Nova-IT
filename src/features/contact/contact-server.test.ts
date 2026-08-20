import { afterEach, beforeEach, expect, test } from "bun:test";
import { skickaKontaktforfragan } from "./contact-server";

const ENV_KEYS = [
  "ADMIN_INTAKE_URL",
  "INTAG_SECRET",
  "RESEND_API_KEY",
  "CONTACT_FORM_FROM",
  "TURNSTILE_SECRET_KEY",
  "TURNSTILE_REQUIRED",
] as const;

const originalEnv: Record<string, string | undefined> = {};
let originalFetch: typeof fetch;

beforeEach(() => {
  for (const key of ENV_KEYS) originalEnv[key] = process.env[key];
  process.env.ADMIN_INTAKE_URL = "https://admin.nova-it.se";
  process.env.INTAG_SECRET = "test-hemlighet";
  process.env.RESEND_API_KEY = "test-resend-key";
  process.env.CONTACT_FORM_FROM = "no-reply@nova-it.se";
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
  kalla: "kontaktformular" as const,
  name: "Anna Andersson",
  email: "anna@example.se",
  phone: "0701234567",
  customerType: "Privatperson" as const,
  companyName: "",
  service: "IT-support",
  tjanstSlug: "it-support",
  urgency: "Normal" as const,
  message: "Datorn startar inte och ger inget felmeddelande.",
  idempotencyKey: "a".repeat(32),
  website: "",
  formRenderedAt: Date.now() - 10_000,
  turnstileToken: null as string | null,
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  }) as Response & { ok: boolean };
}

test("creates the ticket via the admin intake, then sends confirmation and internal notice", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith("/api/public/intag") && init?.method === "POST") {
      return jsonResponse({
        accepted: true,
        arendenummer: "NIT-2601",
        mottagetVid: "2026-07-29T10:00:00.000Z",
        internt: { arendeId: "arende-1", kundEpost: "anna@example.se", kundNamn: "Anna Andersson" },
      });
    }
    if (url.endsWith("/api/public/intag") && init?.method === "PATCH") {
      return jsonResponse({ ok: true });
    }
    if (url.includes("api.resend.com")) {
      return jsonResponse({ id: "email-1" });
    }
    throw new Error(`Unexpected fetch to ${url}`);
  }) as unknown as typeof fetch;

  const result = await skickaKontaktforfragan(validPayload);

  expect(result.accepted).toBe(true);
  expect(result.arendenummer).toBe("NIT-2601");
  expect(result.confirmationSent).toBe(true);

  const resendCalls = calls.filter((call) => call.url.includes("api.resend.com"));
  expect(resendCalls.length).toBe(2); // internal notice + customer confirmation

  const patchCall = calls.find((call) => call.init?.method === "PATCH");
  expect(patchCall).toBeDefined();
  expect(JSON.parse(String(patchCall?.init?.body))).toEqual({
    arendeId: "arende-1",
    status: "skickad",
  });
});

test("skickar internavisering till support@nova-it.se, kundbekräftelsens svarsadress förblir kontakt@nova-it.se", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith("/api/public/intag") && init?.method === "POST") {
      return jsonResponse({
        accepted: true,
        arendenummer: "NIT-2601",
        mottagetVid: "2026-07-29T10:00:00.000Z",
        internt: { arendeId: "arende-1", kundEpost: "anna@example.se", kundNamn: "Anna Andersson" },
      });
    }
    if (url.endsWith("/api/public/intag") && init?.method === "PATCH") {
      return jsonResponse({ ok: true });
    }
    if (url.includes("api.resend.com")) {
      return jsonResponse({ id: "email-1" });
    }
    throw new Error(`Unexpected fetch to ${url}`);
  }) as unknown as typeof fetch;

  await skickaKontaktforfragan(validPayload);

  const resendCalls = calls.filter((call) => call.url.includes("api.resend.com"));
  const internAvisering = resendCalls.find(
    (call) => String(call.init?.body).includes("Din förfrågan är mottagen") === false,
  );
  const kundbekraftelse = resendCalls.find((call) =>
    String(call.init?.body).includes("Din förfrågan är mottagen"),
  );

  expect(JSON.parse(String(internAvisering?.init?.body)).to).toEqual(["support@nova-it.se"]);
  expect(JSON.parse(String(kundbekraftelse?.init?.body)).reply_to).toBe("kontakt@nova-it.se");
});

test("forwards the kundportal activation link (never a password) into the customer confirmation email", async () => {
  const aktiveringslank =
    "https://xyzcompany.supabase.co/auth/v1/verify?token=abc123&type=invite&redirect_to=https://kundportal.nova-it.se/aktivera-konto";
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith("/api/public/intag") && init?.method === "POST") {
      return jsonResponse({
        accepted: true,
        arendenummer: "NIT-2601",
        mottagetVid: "2026-07-29T10:00:00.000Z",
        internt: {
          arendeId: "arende-1",
          kundEpost: "anna@example.se",
          kundNamn: "Anna Andersson",
          kundportalKonto: { kontoSkapat: true, aktiveringslank },
        },
      });
    }
    if (url.endsWith("/api/public/intag") && init?.method === "PATCH") {
      return jsonResponse({ ok: true });
    }
    let isResendHost = false;
    try {
      isResendHost = new URL(url).hostname === "api.resend.com";
    } catch {
      isResendHost = false;
    }
    if (isResendHost) {
      return jsonResponse({ id: "email-1" });
    }
    throw new Error(`Unexpected fetch to ${url}`);
  }) as unknown as typeof fetch;

  await skickaKontaktforfragan(validPayload);

  const resendCalls = calls.filter((call) => {
    try {
      return new URL(call.url).hostname === "api.resend.com";
    } catch {
      return false;
    }
  });
  const customerEmailCall = resendCalls.find((call) =>
    String(call.init?.body).includes("Din förfrågan är mottagen"),
  );
  expect(customerEmailCall).toBeDefined();
  const body = String(customerEmailCall?.init?.body);
  expect(body).toContain(aktiveringslank);
  expect(body.toLowerCase()).not.toContain("lösenord: ");
});

test("does not mention the kundportal when no new account was created", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith("/api/public/intag") && init?.method === "POST") {
      return jsonResponse({
        accepted: true,
        arendenummer: "NIT-2601",
        mottagetVid: "2026-07-29T10:00:00.000Z",
        internt: { arendeId: "arende-1", kundEpost: "anna@example.se", kundNamn: "Anna Andersson" },
      });
    }
    if (url.endsWith("/api/public/intag") && init?.method === "PATCH") {
      return jsonResponse({ ok: true });
    }
    if (url.includes("api.resend.com")) {
      return jsonResponse({ id: "email-1" });
    }
    throw new Error(`Unexpected fetch to ${url}`);
  }) as unknown as typeof fetch;

  await skickaKontaktforfragan(validPayload);

  const resendCalls = calls.filter((call) => call.url.includes("api.resend.com"));
  const customerEmailCall = resendCalls.find((call) =>
    String(call.init?.body).includes("Din förfrågan är mottagen"),
  );
  expect(customerEmailCall).toBeDefined();
  expect(String(customerEmailCall?.init?.body)).not.toContain("kundportal");
});

test("never shows a ticket number when the intake itself rejects the request", async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (String(input).endsWith("/api/public/intag")) {
      return jsonResponse({ accepted: false, fel: "Ogiltig tjänst." }, false, 400);
    }
    throw new Error("Should not reach Resend if the ticket was never created.");
  }) as unknown as typeof fetch;

  await expect(skickaKontaktforfragan(validPayload)).rejects.toThrow();
});

test("still returns the ticket number when only the confirmation email fails", async () => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/api/public/intag") && init?.method === "POST") {
      return jsonResponse({
        accepted: true,
        arendenummer: "NIT-2602",
        mottagetVid: "2026-07-29T10:05:00.000Z",
        internt: { arendeId: "arende-2", kundEpost: "anna@example.se", kundNamn: "Anna Andersson" },
      });
    }
    if (url.endsWith("/api/public/intag") && init?.method === "PATCH") {
      return jsonResponse({ ok: true });
    }
    if (url.includes("api.resend.com")) {
      return jsonResponse({ message: "invalid recipient" }, false, 422);
    }
    throw new Error(`Unexpected fetch to ${url}`);
  }) as unknown as typeof fetch;

  const result = await skickaKontaktforfragan(validPayload);

  expect(result.accepted).toBe(true);
  expect(result.arendenummer).toBe("NIT-2602");
  expect(result.confirmationSent).toBe(false);
});

test("fails closed without calling the intake when configuration is missing", async () => {
  delete process.env.ADMIN_INTAKE_URL;
  let fetchCalled = false;
  globalThis.fetch = (async () => {
    fetchCalled = true;
    throw new Error("fetch should not be called");
  }) as unknown as typeof fetch;

  await expect(skickaKontaktforfragan(validPayload)).rejects.toThrow();
  expect(fetchCalled).toBe(false);
});

test("fails closed and does not leak internal error details when the intake is unreachable", async () => {
  globalThis.fetch = (async () => {
    throw new Error("connection refused at 10.0.0.5:5432");
  }) as unknown as typeof fetch;

  try {
    await skickaKontaktforfragan(validPayload);
    throw new Error("expected submitContactRequest to throw");
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    expect(messageText).not.toContain("10.0.0.5");
    expect(messageText).not.toContain("connection refused");
  }
});

test("rejects a filled-in honeypot field without ever calling the intake", async () => {
  let fetchCalled = false;
  globalThis.fetch = (async () => {
    fetchCalled = true;
    throw new Error("should not be called");
  }) as unknown as typeof fetch;

  await expect(
    skickaKontaktforfragan({ ...validPayload, website: "http://spam.example" }),
  ).rejects.toThrow();
  expect(fetchCalled).toBe(false);
});

test("rejects a submission that arrives implausibly fast after the form rendered", async () => {
  let fetchCalled = false;
  globalThis.fetch = (async () => {
    fetchCalled = true;
    throw new Error("should not be called");
  }) as unknown as typeof fetch;

  await expect(
    skickaKontaktforfragan({ ...validPayload, formRenderedAt: Date.now() }),
  ).rejects.toThrow();
  expect(fetchCalled).toBe(false);
});

test("skips Turnstile verification locally when it is not configured", async () => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("challenges.cloudflare.com")) {
      throw new Error("Turnstile should not be called when unconfigured");
    }
    if (url.endsWith("/api/public/intag") && init?.method === "POST") {
      return jsonResponse({
        accepted: true,
        arendenummer: "NIT-2603",
        mottagetVid: "2026-07-29T11:00:00.000Z",
        internt: { arendeId: "arende-3", kundEpost: "anna@example.se", kundNamn: "Anna Andersson" },
      });
    }
    if (url.endsWith("/api/public/intag") && init?.method === "PATCH")
      return jsonResponse({ ok: true });
    if (url.includes("api.resend.com")) return jsonResponse({ id: "email-1" });
    throw new Error(`Unexpected fetch to ${url}`);
  }) as unknown as typeof fetch;

  const result = await skickaKontaktforfragan(validPayload);
  expect(result.accepted).toBe(true);
});

test("fails closed when Turnstile is required but its secret is missing", async () => {
  process.env.TURNSTILE_REQUIRED = "true";
  let intakeCalled = false;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (String(input).endsWith("/api/public/intag")) intakeCalled = true;
    throw new Error("should not reach the intake without Turnstile configuration");
  }) as unknown as typeof fetch;

  await expect(skickaKontaktforfragan(validPayload)).rejects.toThrow();
  expect(intakeCalled).toBe(false);
});

test("rejects the submission when Turnstile is configured but no token was provided", async () => {
  process.env.TURNSTILE_SECRET_KEY = "test-turnstile-secret";
  let intakeCalled = false;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (String(input).endsWith("/api/public/intag")) intakeCalled = true;
    throw new Error("should not reach the intake without a valid token");
  }) as unknown as typeof fetch;

  await expect(skickaKontaktforfragan({ ...validPayload, turnstileToken: null })).rejects.toThrow();
  expect(intakeCalled).toBe(false);
});

test("rejects the submission when Cloudflare reports the Turnstile token as invalid", async () => {
  process.env.TURNSTILE_SECRET_KEY = "test-turnstile-secret";
  let intakeCalled = false;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("challenges.cloudflare.com")) {
      return jsonResponse({ success: false, "error-codes": ["invalid-input-response"] });
    }
    if (url.endsWith("/api/public/intag")) intakeCalled = true;
    throw new Error("should not reach the intake with an invalid token");
  }) as unknown as typeof fetch;

  await expect(
    skickaKontaktforfragan({ ...validPayload, turnstileToken: "invalid-token" }),
  ).rejects.toThrow();
  expect(intakeCalled).toBe(false);
});

test("proceeds when Turnstile is configured and Cloudflare confirms the token is valid", async () => {
  process.env.TURNSTILE_SECRET_KEY = "test-turnstile-secret";
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("challenges.cloudflare.com")) {
      return jsonResponse({ success: true, action: "contact", hostname: "nova-it.se" });
    }
    if (url.endsWith("/api/public/intag") && init?.method === "POST") {
      return jsonResponse({
        accepted: true,
        arendenummer: "NIT-2604",
        mottagetVid: "2026-07-29T11:05:00.000Z",
        internt: { arendeId: "arende-4", kundEpost: "anna@example.se", kundNamn: "Anna Andersson" },
      });
    }
    if (url.endsWith("/api/public/intag") && init?.method === "PATCH")
      return jsonResponse({ ok: true });
    if (url.includes("api.resend.com")) return jsonResponse({ id: "email-1" });
    throw new Error(`Unexpected fetch to ${url}`);
  }) as unknown as typeof fetch;

  const result = await skickaKontaktforfragan({ ...validPayload, turnstileToken: "valid-token" });
  expect(result.accepted).toBe(true);
  expect(result.arendenummer).toBe("NIT-2604");
});

test("a locked intake rejects the submission without processing any customer data", async () => {
  let fetchCalled = false;
  globalThis.fetch = (async () => {
    fetchCalled = true;
    throw new Error("should not be called");
  }) as unknown as typeof fetch;

  process.env.PUBLIK_INTAG_LAGE = "stangd";
  try {
    await expect(skickaKontaktforfragan(validPayload)).rejects.toThrow(/kontakt@nova-it\.se/);
    // Varken ärendeintaget, Turnstile eller Resend får ha kontaktats.
    expect(fetchCalled).toBe(false);
  } finally {
    delete process.env.PUBLIK_INTAG_LAGE;
  }
});
