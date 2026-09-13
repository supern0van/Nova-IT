import { lasIntagLage } from "@/features/contact/intag-lage";
import { chattAiArPaslaget } from "@/features/support/support-chat-server";

/**
 * `/health` (se `src/routes/health.ts`) - en Cloudflare-övervakningsendpoint
 * (förslag ur den breda granskningen 2026-09-13), byggd för uppgiften den
 * faktiskt ska lösa: INTE "processen svarar" (Workers svarar nästan alltid
 * 200 även när en nedströms integration är trasig), utan "är de faktiska
 * beroendena konfigurerade rätt". Kontrollerar bara KONFIGURATION
 * (miljövariabler + bindningars NÄRVARO) - aldrig ett riktigt anrop mot
 * Turnstile, adminportalens intag eller AI-budgeten, eftersom en
 * övervakningstjänst kan polla detta ofta och ett sådant anrop skulle vara
 * kostsamt/kunna trigga PUB-1/PUB-3-hastighetsspärrarna eller (för
 * AI-budgeten) faktiskt FÖRBRUKA en reservation - se `harAiBudget` i
 * `support-ai-runtime.ts`, som gör ett riktigt `/reservera`-anrop och därför
 * medvetet INTE återanvänds här.
 *
 * `status: "degraderad"` sätts bara av KRITISKA brister - sådant som gör
 * att en kund inte kan nå Nova IT alls. Kompletterande/sekundära skydd
 * (PUB-1/PUB-3-hastighetsspärrarna, samma fail-open-resonemang som
 * DEC-0007 i docs/DECISIONS.md) och stödfunktioner (supportassistenten)
 * redovisas men påverkar inte toppstatusen - de har redan sina egna
 * fail-open-fallbacker om de saknas.
 */

type CloudflareRuntimeEnv = {
  AI?: unknown;
  AI_BUDGET_SERVICE?: unknown;
  SUPPORT_CHAT_RATE_LIMITER?: unknown;
  CONTACT_FORM_RATE_LIMITER?: unknown;
};

/** Minsta möjliga typ av det som faktiskt läses ur en inkommande request i
 * en server route - se samma mönster i `support-ai-runtime.ts`/
 * `contact-ratelimit.ts`/`case-status-server.ts`, fast utan behovet av
 * `getRequest()`: en server route-handler får redan requesten direkt. */
export type HalsokontrollRequest = {
  runtime?: { cloudflare?: { env?: CloudflareRuntimeEnv } };
};

export interface Halsokontroll {
  status: "ok" | "degraderad";
  tid: string;
  kontroller: {
    kontaktformular: { konfigurerad: boolean; intagLage: "oppen" | "stangd" };
    arendestatus: { konfigurerad: boolean };
    turnstile: { konfigurerad: boolean; obligatorisk: boolean };
    supportassistent: {
      klassificerarePaslagen: boolean;
      chattPaslagen: boolean;
      workersAiBindning: boolean;
      aiBudgetBindning: boolean;
    };
    hastighetsskydd: { supportChattBindning: boolean; kontaktformularBindning: boolean };
  };
}

function harVarde(varde: string | undefined): boolean {
  return typeof varde === "string" && varde.trim().length > 0;
}

export function byggHalsokontroll(
  env: Record<string, string | undefined>,
  request: HalsokontrollRequest,
): Halsokontroll {
  const cf = request.runtime?.cloudflare?.env ?? {};

  const intagLage = lasIntagLage(env.PUBLIK_INTAG_LAGE);
  const kontaktformularKonfigurerad = harVarde(env.ADMIN_INTAKE_URL) && harVarde(env.INTAG_SECRET);

  const arendestatusKonfigurerad =
    harVarde(env.ADMIN_INTAKE_URL) && harVarde(env.STATUSKOLL_SECRET);

  const turnstileKonfigurerad = harVarde(env.TURNSTILE_SECRET_KEY);
  // Samma villkor som `verifieraTurnstile` i contact-server.ts - Turnstile
  // är obligatoriskt (fail-closed) i produktion eller när det uttryckligen
  // begärts, annars valfritt (soft-fail lokalt/i förhandsvisningar).
  const turnstileObligatorisk = env.NODE_ENV === "production" || env.TURNSTILE_REQUIRED === "true";

  const kritiskaBrister =
    (intagLage === "oppen" && !kontaktformularKonfigurerad) ||
    (turnstileObligatorisk && !turnstileKonfigurerad) ||
    !arendestatusKonfigurerad;

  return {
    status: kritiskaBrister ? "degraderad" : "ok",
    tid: new Date().toISOString(),
    kontroller: {
      kontaktformular: { konfigurerad: kontaktformularKonfigurerad, intagLage },
      arendestatus: { konfigurerad: arendestatusKonfigurerad },
      turnstile: { konfigurerad: turnstileKonfigurerad, obligatorisk: turnstileObligatorisk },
      supportassistent: {
        klassificerarePaslagen: chattAiArPaslaget(env.SUPPORT_AI_LAGE),
        chattPaslagen: chattAiArPaslaget(env.SUPPORT_CHAT_LAGE),
        workersAiBindning: cf.AI != null,
        aiBudgetBindning: cf.AI_BUDGET_SERVICE != null,
      },
      hastighetsskydd: {
        supportChattBindning: cf.SUPPORT_CHAT_RATE_LIMITER != null,
        kontaktformularBindning: cf.CONTACT_FORM_RATE_LIMITER != null,
      },
    },
  };
}
