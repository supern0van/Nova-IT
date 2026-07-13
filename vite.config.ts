// Lovable build adapter: retained so commits can still sync to the original editor.
// It configures the local Vite/TanStack build only; production runs on Cloudflare Workers.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Use Nova IT's server entry for SSR and canonical-domain redirects.
    server: { entry: "server" },
  },
});
