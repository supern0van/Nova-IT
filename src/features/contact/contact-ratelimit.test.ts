import { afterEach, beforeEach, expect, mock, test } from "bun:test";

const getRequestMock = mock(() => ({
  headers: new Headers(),
  runtime: { cloudflare: { env: {} } },
}));
mock.module("@tanstack/react-start/server", () => ({ getRequest: getRequestMock }));

const { arKontaktformularIpSparrad } = await import("./contact-ratelimit");

beforeEach(() => {
  getRequestMock.mockImplementation(() => ({
    headers: new Headers(),
    runtime: { cloudflare: { env: {} } },
  }));
});

afterEach(() => {
  getRequestMock.mockReset();
});

test("PUB-3: släpper igenom (fail-open) när bindningen saknas", async () => {
  expect(await arKontaktformularIpSparrad()).toBe(false);
});

test("PUB-3: släpper igenom (fail-open) när ingen IP kan läsas ut", async () => {
  getRequestMock.mockImplementation(() => ({
    headers: new Headers(),
    runtime: {
      cloudflare: {
        env: { CONTACT_FORM_RATE_LIMITER: { limit: async () => ({ success: true }) } },
      },
    },
  }));
  expect(await arKontaktformularIpSparrad()).toBe(false);
});

test("PUB-3: nekar när bindningen säger nej", async () => {
  getRequestMock.mockImplementation(() => ({
    headers: new Headers({ "cf-connecting-ip": "203.0.113.9" }),
    runtime: {
      cloudflare: {
        env: { CONTACT_FORM_RATE_LIMITER: { limit: async () => ({ success: false }) } },
      },
    },
  }));
  expect(await arKontaktformularIpSparrad()).toBe(true);
});

test("PUB-3: släpper igenom när bindningen säger ja", async () => {
  getRequestMock.mockImplementation(() => ({
    headers: new Headers({ "cf-connecting-ip": "203.0.113.9" }),
    runtime: {
      cloudflare: {
        env: { CONTACT_FORM_RATE_LIMITER: { limit: async () => ({ success: true }) } },
      },
    },
  }));
  expect(await arKontaktformularIpSparrad()).toBe(false);
});
