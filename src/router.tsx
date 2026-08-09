import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { routeTree } from "./routeTree.gen";

// Fräsch slumpmässig nonce per serverrendering - getRouter() körs en gång
// per request server-side. Läses av __root.tsx:s `headers()` (samma värde,
// samma request) för CSP:n, och av router-core för att sätta nonce-
// attributet på de inline-scripts som bär bootstrap-/hydreringsdata.
// Ingen effekt i webbläsaren (createIsomorphicFn().server() kör bara här).
const getSSROptions = createIsomorphicFn().server(() => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const nonce = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return { nonce };
});

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    ssr: getSSROptions(),
  });

  return router;
};
