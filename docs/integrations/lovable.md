# Lovable integration boundary

Lovable is the project's original editor and remains connected to the Git branch so that
commits can appear in that editor. It is not Nova IT's public hosting platform.

## What stays

- `@lovable.dev/vite-tanstack-config` supplies the Vite and TanStack Start build setup.
- `src/integrations/lovable/error-reporting.ts` optionally reports a React error when the
  Lovable editor has injected its own event hook.
- `AGENTS.md` protects the connected Git history from unsafe rewrites.

## What does not happen in production

- The public site is deployed as the `supern0van-nova-it` Cloudflare Worker.
- `nova-it.se` does not load scripts, assets, analytics, or API calls from Lovable.
- If the Lovable event hook is absent, the error-reporting adapter is a no-op.

Keep new application code outside `src/integrations/lovable`. That directory is reserved
for the editor integration only.
