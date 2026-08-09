import { useEffect, useId, useRef } from "react";
import { getTurnstileSiteKey } from "@/features/contact/contact-server";

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          appearance?: "always" | "execute" | "interaction-only";
          size?: "normal" | "compact" | "flexible";
          callback: (token: string) => void;
          "error-callback"?: (errorCode?: string) => void;
          "expired-callback"?: () => void;
          "timeout-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Kunde inte ladda Turnstile."));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * Cloudflare Turnstile-widget för spamskydd på kontaktformuläret.
 *
 * Site Key hämtas från den publika Workern vid runtime. Det gör att en
 * Wrangler-konfigurerad Site Key fungerar även om den inte fanns vid Vite-
 * builden. Saknas Site Key renderas inget widget för lokal utveckling.
 */
export function TurnstileWidget({
  action,
  onToken,
  diskret = false,
}: {
  action: string;
  onToken: (token: string | null) => void;
  diskret?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const callbackName = useId().replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    let cancelled = false;

    getTurnstileSiteKey()
      .then((siteKey) => {
        if (!siteKey || cancelled || !containerRef.current) {
          onToken(null);
          return null;
        }
        return loadTurnstileScript().then(() => siteKey);
      })
      .then((siteKey) => {
        if (!siteKey || cancelled || !containerRef.current || !window.turnstile) return;
        // Turnstile sköter själv retry/reset vid timeout och auto-retry.
        // Anropa inte reset() här igen: det kan skapa en callback/reset-loop.
        const clearToken = () => onToken(null);
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          ...(diskret
            ? { appearance: "interaction-only" as const, size: "flexible" as const }
            : {}),
          callback: (token: string) => onToken(token),
          "error-callback": clearToken,
          "expired-callback": clearToken,
          "timeout-callback": clearToken,
        });
      })
      .catch(() => onToken(null));

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid={`turnstile-${callbackName}`}
      className={diskret ? "min-h-0 overflow-hidden" : "mt-2"}
    />
  );
}
