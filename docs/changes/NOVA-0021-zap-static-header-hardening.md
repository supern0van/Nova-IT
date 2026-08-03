# NOVA-0021 – ZAP-fynd för statiska metadatafiler

## Kontext

ZAP by Checkmarx rapporterade att `robots.txt` och `sitemap.xml` saknade vissa
säkerhetsheaders. De filerna levereras som statiska filer och passerar inte
alltid webbplatsens SSR-wrapper i `src/server.ts`.

## Ändring

- Lade `public/_headers` med defensiva headers för `/robots.txt` och
  `/sitemap.xml`.
- Utökade `bun run audit:cloudflare-live` så live-auditen även kontrollerar
  metadatafilerna för `X-Content-Type-Options`, `X-Frame-Options` och
  `frame-ancestors`.

## Verifiering

- Körs innan merge: `bun run test`, `bun run lint`, `bun run typecheck`,
  `bun run build`.
- Efter deploy ska `bun run audit:cloudflare-live` endast falla på de redan
  kända DNS-/mailfynden tills de är åtgärdade i Cloudflare/DNS.
