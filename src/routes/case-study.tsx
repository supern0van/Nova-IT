import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/case-study")({
  beforeLoad: () => {
    throw redirect({ to: "/arbetssatt" });
  },
  component: () => null,
});
