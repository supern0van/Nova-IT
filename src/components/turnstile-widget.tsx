import { useEffect, useId, useRef } from "react";

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
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
 * Om `VITE_TURNSTILE_SITE_KEY` inte är satt (t.ex. innan Turnstile
 * konfigurerats i Cloudflare Dashboard) renderas ingenting och `onToken`
 * anropas aldrig - formuläret fortsätter fungera exakt som innan denna
 * funktion fanns, det skickas bara utan en token. Servern (`contact-server.ts`)
 * hoppar då över verifieringen på samma sätt (soft-fail, inte hard-fail) -
 * annars hade en deploy innan Turnstile är klart konfigurerat i Cloudflare
 * gjort att INGEN kunde skicka in kontaktformuläret.
 */
export function TurnstileWidget({ onToken }: { onToken: (token: string | null) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const callbackName = useId().replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) {
      onToken(null);
      return;
    }

    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => onToken(token),
          "error-callback": () => onToken(null),
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

  if (!SITE_KEY) return null;

  return <div ref={containerRef} data-testid={`turnstile-${callbackName}`} className="mt-2" />;
}
