-- ══════════════════════════════════════════════════════════════════════════
-- Kolumner för det säkra publika ärendeintaget (nova-it.se → adminportalen)
-- ══════════════════════════════════════════════════════════════════════════
--
-- Bakgrund: den publika webbplatsens kontaktformulär och supportassistent
-- hade tidigare ingen databaslagring alls - bara ett e-postutskick via
-- Resend. Ett misslyckat mejl betydde att förfrågan inte fanns registrerad
-- någonstans. Dessa kolumner låter det nya publika intaget (se
-- app/api/public/intag/route.ts) skriva riktiga ärenden till samma
-- admin_arenden-tabell som adminportalen redan använder, med:
--
--   - idempotensnyckel: förhindrar att dubbelklick, timeout-retries eller
--     parallella requests skapar flera ärenden för samma inskickning.
--     Nullable och unik: adminskapade ärenden har alltid null (flera null-
--     värden bryter inte en unik constraint i Postgres).
--   - bekraftelse_status: separat status för om kundens
--     mottagningsbekräftelse har skickats, väntar eller misslyckades -
--     frikopplat från ärendets egen status (ny/pågående/etc), så ett
--     e-postfel aldrig kan tolkas som att ärendet självt misslyckades.

alter table public.admin_arenden
  add column if not exists idempotensnyckel text,
  add column if not exists bekraftelse_status text not null default 'vantar'
    check (bekraftelse_status in ('vantar', 'skickad', 'misslyckad'));

create unique index if not exists admin_arenden_idempotensnyckel_key
  on public.admin_arenden (idempotensnyckel)
  where idempotensnyckel is not null;

comment on column public.admin_arenden.idempotensnyckel is
  'Stabil nyckel från den publika webbplatsens ärendeintag. Unik (partiellt index, ignorerar null) så samma inskickning aldrig skapar två ärenden. Null för ärenden skapade direkt i adminportalen.';

comment on column public.admin_arenden.bekraftelse_status is
  'Status för kundens mottagningsbekräftelse via e-post, frikopplat från ärendets egen status. "vantar" tills utskicket har försökts, "skickad" vid lyckad leverans, "misslyckad" om leveransen misslyckades (ärendet finns kvar och kan skickas om).';
