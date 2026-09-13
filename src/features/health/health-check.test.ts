import { expect, test } from "bun:test";

import { byggHalsokontroll } from "./health-check";

const grundEnv = {
  ADMIN_INTAKE_URL: "https://admin.nova-it.se",
  INTAG_SECRET: "test-hemlighet",
  STATUSKOLL_SECRET: "test-statuskoll-hemlighet",
  TURNSTILE_SECRET_KEY: "test-turnstile-secret",
} as const;

const tomRequest = { runtime: { cloudflare: { env: {} } } };

test("status ok när alla kritiska integrationer är konfigurerade", () => {
  const rapport = byggHalsokontroll(grundEnv, tomRequest);
  expect(rapport.status).toBe("ok");
  expect(rapport.kontroller.kontaktformular.konfigurerad).toBe(true);
  expect(rapport.kontroller.arendestatus.konfigurerad).toBe(true);
});

test("ett öppet intag utan ADMIN_INTAKE_URL/INTAG_SECRET är kritiskt - status degraderad", () => {
  const rapport = byggHalsokontroll(
    { ...grundEnv, ADMIN_INTAKE_URL: undefined, INTAG_SECRET: undefined },
    tomRequest,
  );
  expect(rapport.status).toBe("degraderad");
  expect(rapport.kontroller.kontaktformular.konfigurerad).toBe(false);
});

test("ett STÄNGT intag utan ADMIN_INTAKE_URL/INTAG_SECRET är INTE kritiskt (samma villkor som skickaKontaktforfragan)", () => {
  const rapport = byggHalsokontroll(
    {
      ...grundEnv,
      ADMIN_INTAKE_URL: undefined,
      INTAG_SECRET: undefined,
      PUBLIK_INTAG_LAGE: "stangd",
    },
    tomRequest,
  );
  expect(rapport.kontroller.kontaktformular.intagLage).toBe("stangd");
  // Ärendestatuskollen delar ADMIN_INTAKE_URL och är fortsatt kritisk -
  // status blir alltså ändå "degraderad" härifrån, oberoende av
  // kontaktformulärets eget villkor.
  expect(rapport.kontroller.arendestatus.konfigurerad).toBe(false);
});

test("saknad STATUSKOLL_SECRET är alltid kritiskt, oavsett intagets läge", () => {
  const rapport = byggHalsokontroll({ ...grundEnv, STATUSKOLL_SECRET: undefined }, tomRequest);
  expect(rapport.status).toBe("degraderad");
  expect(rapport.kontroller.arendestatus.konfigurerad).toBe(false);
});

test("Turnstile obligatoriskt i produktion - saknad hemlighet är kritiskt", () => {
  const rapport = byggHalsokontroll(
    { ...grundEnv, TURNSTILE_SECRET_KEY: undefined, NODE_ENV: "production" },
    tomRequest,
  );
  expect(rapport.kontroller.turnstile.obligatorisk).toBe(true);
  expect(rapport.status).toBe("degraderad");
});

test("Turnstile obligatoriskt via TURNSTILE_REQUIRED=true även utanför produktion", () => {
  const rapport = byggHalsokontroll(
    { ...grundEnv, TURNSTILE_SECRET_KEY: undefined, TURNSTILE_REQUIRED: "true" },
    tomRequest,
  );
  expect(rapport.kontroller.turnstile.obligatorisk).toBe(true);
  expect(rapport.status).toBe("degraderad");
});

test("saknad Turnstile-hemlighet är INTE kritiskt utanför produktion utan TURNSTILE_REQUIRED", () => {
  const rapport = byggHalsokontroll({ ...grundEnv, TURNSTILE_SECRET_KEY: undefined }, tomRequest);
  expect(rapport.kontroller.turnstile.obligatorisk).toBe(false);
  expect(rapport.status).toBe("ok");
});

test("supportassistentens av/på-lägen och bindningar redovisas men styr aldrig toppstatusen", () => {
  const rapport = byggHalsokontroll(
    { ...grundEnv, SUPPORT_AI_LAGE: "pa", SUPPORT_CHAT_LAGE: "pa" },
    tomRequest,
  );
  expect(rapport.kontroller.supportassistent.klassificerarePaslagen).toBe(true);
  expect(rapport.kontroller.supportassistent.chattPaslagen).toBe(true);
  expect(rapport.kontroller.supportassistent.workersAiBindning).toBe(false);
  expect(rapport.status).toBe("ok");
});

test("läser AI- och rate limiter-bindningarnas NÄRVARO från requesten, utan att anropa dem", () => {
  let anropadeAI = false;
  let anropadeBudget = false;
  const request = {
    runtime: {
      cloudflare: {
        env: {
          AI: {
            run: () => {
              anropadeAI = true;
              return Promise.resolve();
            },
          },
          AI_BUDGET_SERVICE: {
            fetch: () => {
              anropadeBudget = true;
              return Promise.resolve(new Response());
            },
          },
          SUPPORT_CHAT_RATE_LIMITER: {},
          CONTACT_FORM_RATE_LIMITER: {},
        },
      },
    },
  };

  const rapport = byggHalsokontroll(grundEnv, request);

  expect(rapport.kontroller.supportassistent.workersAiBindning).toBe(true);
  expect(rapport.kontroller.supportassistent.aiBudgetBindning).toBe(true);
  expect(rapport.kontroller.hastighetsskydd.supportChattBindning).toBe(true);
  expect(rapport.kontroller.hastighetsskydd.kontaktformularBindning).toBe(true);
  expect(anropadeAI).toBe(false);
  expect(anropadeBudget).toBe(false);
});

test("saknad request/bindning ger false utan att kasta", () => {
  const rapport = byggHalsokontroll(grundEnv, {});
  expect(rapport.kontroller.supportassistent.workersAiBindning).toBe(false);
  expect(rapport.kontroller.hastighetsskydd.supportChattBindning).toBe(false);
});
