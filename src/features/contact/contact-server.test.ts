import { afterEach, beforeEach, expect, test } from "bun:test";
import { skickaKontaktforfragan } from "./contact-server";

const ENV_KEYS = [
  "ADMIN_INTAKE_URL",
  "INTAG_SECRET",
  "RESEND_API_KEY",
  "CONTACT_FORM_FROM",
] as const;

const originalEnv: Record<string, string | undefined> = {};
let originalFetch: typeof fetch;

beforeEach(() => {
  for (const key of ENV_KEYS) originalEnv[key] = process.env[key];
  process.env.ADMIN_INTAKE_URL = "https://admin.nova-it.se";
  process.env.INTAG_SECRET = "test-hemlighet";
  process.env.RESEND_API_KEY = "test-resend-key";
  process.env.CONTACT_FORM_FROM = "no-reply@nova-it.se";
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
