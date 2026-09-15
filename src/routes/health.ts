import { createFileRoute } from "@tanstack/react-router";

import { byggHalsokontroll, type HalsokontrollRequest } from "@/features/health/health-check";

/**
 * `/health` - en enkel, ren server route (inget UI, se start-core/
 * server-routes-mönstret i @tanstack/react-start). Tänkt att pollas av en
 * extern övervakningstjänst (Cloudflare-larm, en uptime-kontroll), se
 * `byggHalsokontroll`s huvudkommentar för designresonemanget - kontrollerar
 * bara konfiguration, gör aldrig ett riktigt anrop mot Turnstile,
 * adminportalens intag eller AI-budgeten.
 *
 * Svarar ALLTID 200 - själva transportlagret fungerar per definition om
 * den här handlern körde. Om något kritiskt är felkonfigurerat syns det i
 * svarskroppens `status: "degraderad"` i stället, så en extern övervakare
 * själv kan avgöra vad som är en driftsstörning kontra en
 * konfigurationsvarning, i stället för att en enda flagga tvingar samma
 * tolkning på alla.
 */
export const Route = createFileRoute("/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const runtimeRequest = request as unknown as HalsokontrollRequest;
        const rapport = byggHalsokontroll(process.env, runtimeRequest);
        return Response.json(rapport, {
          headers: { "Cache-Control": "no-store" },
        });
      },
    },
  },
});
