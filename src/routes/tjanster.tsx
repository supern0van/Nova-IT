import { createFileRoute, Outlet } from "@tanstack/react-router";

// Ren layoutroute: den faktiska /tjanster-katalogen ligger i tjanster.index.tsx
// (så egen head/meta), och /tjanster/$slug renderas via Outlet - annars
// mountas aldrig $slug-sidans component, bara layoutens.
export const Route = createFileRoute("/tjanster")({
  component: () => <Outlet />,
});
