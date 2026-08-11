import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { FORM_ACTION_DIRECTIVE } from "./lib/security-policy";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

const CANONICAL_HOST = "nova-it.se";
const REDIRECT_HOSTS = new Set(["novait.se", "www.novait.se", "www.nova-it.se"]);

// Cloudflare injicerar sin egen Web Analytics-beacon (static.cloudflareinsights.com)
// och Turnstile-widgeten laddas från challenges.cloudflare.com - båda måste vara
// tillåtna här, annars blockerar CSP:n dem i webbläsaren trots att de fungerar i test.
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
  "Cross-Origin-Opener-Policy": "same-origin",
};

// SSR-renderade sidor får sin CSP från src/routes/__root.tsx:s `headers()`
// (nonce-baserad script-src, se src/router.tsx). Den här är bara en reserv
// för svar som aldrig går genom root-routen - redirects och det egna
// felsidefallet nedan - så de aldrig blir helt utan CSP.
const FALLBACK_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
  "frame-src https://challenges.cloudflare.com",
  "connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  FORM_ACTION_DIRECTIVE,
].join("; ");

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  // Sätt aldrig över en redan satt CSP - annars skrivs root-routens
  // nonce-baserade header ut av den här reservpolicyn på varje SSR-svar.
  if (!headers.has("Content-Security-Policy")) {
    headers.set("Content-Security-Policy", FALLBACK_CSP);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (REDIRECT_HOSTS.has(url.hostname)) {
        url.protocol = "https:";
        url.hostname = CANONICAL_HOST;
        url.port = "";
        return withSecurityHeaders(Response.redirect(url, 308));
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withSecurityHeaders(await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
