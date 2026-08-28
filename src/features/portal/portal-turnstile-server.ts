import { createServerFn } from "@tanstack/react-start";

import { KUNDPORTAL_ORIGIN } from "@/lib/security-policy";

export const KUNDPORTAL_TURNSTILE_CONFIG_URL = `${KUNDPORTAL_ORIGIN}/api/public/turnstile-config`;

export function lasKundportalTurnstileSiteKey(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const siteKey = (payload as { siteKey?: unknown }).siteKey;
  return typeof siteKey === "string" && siteKey.trim().length > 0 ? siteKey.trim() : null;
}

/**
 * Portalpanelen pa nova-it.se postar inloggningen till kundportalen. Token maste
 * darfor skapas med kundportalens publika site key, eftersom kundportalen
 * verifierar den med sitt eget Turnstile secret.
 */
export const getKundportalTurnstileSiteKey = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const response = await fetch(KUNDPORTAL_TURNSTILE_CONFIG_URL, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;

    return lasKundportalTurnstileSiteKey(await response.json().catch(() => null));
  } catch {
    return null;
  }
});
