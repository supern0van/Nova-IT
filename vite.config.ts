import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

/**
 * Nova IT:s egen Vite-konfiguration.
 *
 * Ersätter `@lovable.dev/vite-tanstack-config`, som tidigare var hela
 * byggkonfigurationen bakom tre rader. Allt som wrappern satte upp för
 * produktion står nu uttryckligen här, så att bygget går att läsa, granska
 * och ändra utan att gå via ett tredjepartspaket.
 *
 * Pluginordningen är densamma som wrappern använde. Den är inte godtycklig:
 * `tanstackStart` måste registreras före `nitro`, och `viteReact` läggs sist.
 *
 * Medvetet INTE överflyttat - allt var till för Lovable-editorn, inte för
 * produktionsbygget: `lovable-tagger`, `vite-plugin-dev-server-bridge`,
 * `vite-plugin-hmr-gate` och `@tanstack/devtools-vite`.
 */
export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Nova IT:s serverentry för SSR och canonical-domän-omdirigeringar.
      server: { entry: "server" },
      /**
       * Byggtidsskydd som wrappern satte som standard och som annars hade
       * försvunnit tyst vid flytten. Det får bygget att FELA om klientkod
       * importerar från `**\/server\/**` eller från `server-only`.
       *
       * Det är en säkerhetsgräns, inte en stilregel: utan den kan en
       * felaktig import dra in serverkod - och därmed hemligheter som
       * INTAG_SECRET eller RESEND_API_KEY - i webbläsarbundlen.
       */
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
    /**
     * `defaultPreset` - inte `preset`. Skillnaden är avsiktlig och viktig:
     * defaultPreset är ett FALLBACK som gäller när inget annat pekats ut,
     * medan preset skulle låsa bygget hårt och överrida Cloudflare Workers
     * Builds egen miljödetektering och NITRO_PRESET.
     *
     * Utan raden faller nitro tillbaka på `node-server` och bygget
     * producerar en Node-server utan `.output/server/wrangler.json` - alltså
     * en artefakt som inte går att deploya som Worker. Verifierat: det var
     * precis vad som hände i första försöket att ersätta wrappern.
     *
     * `cloudflare: { nodeCompat, deployConfig }` ska INTE sättas här.
     * Wrappern satte det bara i sin egen sandbox-gren; cloudflare-module-
     * presetet sätter redan nodejs_compat och genererar wrangler.json.
     */
    nitro({ defaultPreset: "cloudflare-module" }),
    viteReact(),
  ],
});
