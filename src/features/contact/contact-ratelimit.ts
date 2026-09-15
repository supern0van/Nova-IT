import { createServerOnlyFn } from "@tanstack/react-start";

/**
 * PUB-3 (fördjupad revision 2026-09-12): eget per-IP hastighetsskydd för
 * kontaktformuläret/supportassistentens handoff (`skickaKontaktforfragan`),
 * utöver Turnstile och adminportalens nedströms IP-spärr. Samma mönster,
 * samma motivering (fail-open, riktig distribuerad Cloudflare-tjänst i
 * stället för en Worker-minnesräknare) som `support-ai-runtime.ts`s
 * `arChattIpSparrad` (PUB-1) - se den filens huvudkommentar.
 *
 * Egen bindning (`CONTACT_FORM_RATE_LIMITER`) och egen fil i stället för att
 * återanvända supportchattens: olika `namespace_id` krävs ändå per bindning,
 * och kontaktformuläret hör till en annan feature-katalog.
 */
export const arKontaktformularIpSparrad = createServerOnlyFn(async (): Promise<boolean> => {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest() as unknown as {
      headers: { get(name: string): string | null };
      runtime?: {
        cloudflare?: {
          env?: {
            CONTACT_FORM_RATE_LIMITER?: {
              limit: (opts: { key: string }) => Promise<{ success: boolean }>;
            };
          };
        };
      };
    };
    const begransare = request?.runtime?.cloudflare?.env?.CONTACT_FORM_RATE_LIMITER;
    if (!begransare) return false;

    const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for");
    if (!ip) return false; // ingen pålitlig nyckel att begränsa på - hellre släppa igenom

    const { success } = await begransare.limit({ key: ip });
    return !success;
  } catch {
    return false;
  }
});
