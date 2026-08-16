# Lovable integration boundary

Lovable was the project's original editor. Nova IT's public site no longer
depends on it in any way at build time or at runtime.

## What is left

- `.lovable/project.json` — a marker file identifying the original template.
  Kept as a historical reference only; nothing reads it.
- `AGENTS.md` — protects the connected Git history from unsafe rewrites.

That is all. Nothing in `src/` references Lovable, and no Lovable package is
installed.

## What was removed, and when

- **2026-08-16 (NOVA-0041)** — `@lovable.dev/vite-tanstack-config` was the
  entire Vite build configuration behind three lines in `vite.config.ts`. It
  was replaced with Nova IT's own explicit configuration. Editor-only plugins
  (`lovable-tagger`, `vite-plugin-dev-server-bridge`, `vite-plugin-hmr-gate`,
  `devtools-vite`) were deliberately not carried over. **This ended the sync
  back to the Lovable editor.**
- **2026-08-16 (NOVA-0042)** — `src/integrations/lovable/error-reporting.ts`
  reported React errors to a `window.__lovableEvents` hook that only the
  Lovable editor ever injected. It was a permanent no-op in production and was
  removed together with its call in the root error boundary. `console.error`
  in the same component already handled logging.
- **2026-08-16 (NOVA-0042)** — four `@lovable.dev/*` packages were listed in
  `bunfig.toml` under `minimumReleaseAgeExcludes`, which bypasses the 24-hour
  supply-chain guard. They no longer exist in the project, so the exclusions
  were removed and the list is now empty.
- **2026-08-03 (NOVA-0023)** — generic Lovable/v0 favicons were replaced with
  the Nova IT mark across all three web properties.

## Production facts

- The public site is deployed as the `supern0van-nova-it` Cloudflare Worker.
- `nova-it.se` loads no scripts, assets, analytics or API calls from Lovable.

## Note on search-result icons

Google may still display a cached Lovable-era icon for `nova-it.se` in search
results. The served favicon has been the Nova IT mark since 2026-08-03, and
`/favicon.svg` is correct in production. Google refreshes cached favicons on
its own schedule; there is nothing left to fix in the repository.

The site serves no `/favicon.ico`. Google's crawler historically prefers that
path and handles SVG-only favicons less reliably, so adding a raster
`favicon.ico` is the one remaining lever if the stale icon persists.
