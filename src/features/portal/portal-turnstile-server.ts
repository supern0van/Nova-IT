import { createServerFn } from "@tanstack/react-start";

import { KUNDPORTAL_ORIGIN } from "@/lib/security-policy";

export const KUNDPORTAL_TURNSTILE_CONFIG_URL = `${KUNDPORTAL_ORIGIN}/api/public/turnstile-config`;

export function lasKundportalTurnstileSiteKey(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const siteKey = (payload as { siteKey?: unknown }).siteKey;
  return typeof siteKey === "string" && siteKey.trim().length > 0 ? siteKey.trim() : null;
}

// Runda 3-optimeringsfynd #7: `PortalMeny` sitter i sajt-övergripande
// headern (site-chrome.tsx) och `TurnstileWidget` monteras varje gång en
// besökare öppnar inloggningspanelen - utan cache gjorde det ett helt nytt
// Worker-till-Worker-anrop mot kundportalens /api/public/turnstile-config
// VARJE gång, trots att site key:n i praktiken är statisk under en hel
// deploy. Modul-nivå-cache i Worker-isolatet, samma sorts mönster som
// `scriptLoadPromise` i turnstile-widget.tsx. Cachar bara ett LYCKAT svar -
// ett misslyckat anrop (t.ex. adminportalen otillgänglig) ska aldrig
// fastna cachat, så nästa öppning av panelen försöker på nytt direkt i
// stället för att vänta ut TTL:en.
const SITE_KEY_CACHE_TTL_MS = 5 * 60 * 1000;
let siteKeyCache: { siteKey: string; hamtadVid: number } | null = null;

/**
 * Den faktiska hämtnings-/cachningslogiken, exporterad separat (samma mönster
 * som `sokArendestatus`/`lookupCaseStatus` i case-status-server.ts) så den går
 * att testa direkt utan `createServerFn`s server-runtime-kontext
 * (AsyncLocalStorage), som en vanlig enhetstestprocess inte har.
 */
export async function hamtaKundportalTurnstileSiteKey(): Promise<string | null> {
  const nu = Date.now();
  if (siteKeyCache && nu - siteKeyCache.hamtadVid < SITE_KEY_CACHE_TTL_MS) {
    return siteKeyCache.siteKey;
  }

  try {
    const response = await fetch(KUNDPORTAL_TURNSTILE_CONFIG_URL, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;

    const siteKey = lasKundportalTurnstileSiteKey(await response.json().catch(() => null));
    if (siteKey) siteKeyCache = { siteKey, hamtadVid: nu };
    return siteKey;
  } catch {
    return null;
  }
}

/**
 * Portalpanelen pa nova-it.se postar inloggningen till kundportalen. Token maste
 * darfor skapas med kundportalens publika site key, eftersom kundportalen
 * verifierar den med sitt eget Turnstile secret.
 */
export const getKundportalTurnstileSiteKey = createServerFn({ method: "GET" }).handler(
  hamtaKundportalTurnstileSiteKey,
);
