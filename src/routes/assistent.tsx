import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/assistent")({
  beforeLoad: () => {
    throw redirect({ to: "/kontakt", search: { service: undefined } });
  },
  component: () => null,
});
