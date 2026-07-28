-- ══════════════════════════════════════════════════════════════════════════
-- Personal-/teknikerfält på profiles – riktig personalmodell för tilldelning
-- ══════════════════════════════════════════════════════════════════════════
--
-- Tidigare tilldelades ärenden och bokningar mot en helt hårdkodad
-- testpersonallista (`demoAnvandare` i lib/demo-data.ts, exponerad via
-- lib/auth/demo-auth.ts). Den listan har inga riktiga id:n och kan aldrig
-- matcha en verklig portalanvändare.
--
-- Denna migration lägger till exakt två additiva kolumner på det redan
-- existerande `public.profiles` (se 20260727014500_profiler_och_roller.sql):
--   - `titel`: fritext för visning i tilldelningsval (t.ex. "IT-tekniker").
--     Ingen koppling till SystemRoll eller behörigheter.
--   - `aktiv`: om kontot ska erbjudas som tilldelningsbart för NYA ärenden/
--     bokningar. Påverkar varken inloggning eller SystemRoll-behörighet –
--     ett konto med aktiv=false kan fortfarande logga in, det döljs bara ur
--     tilldelningsvyerna.
--
-- Ingen RLS-ändring: profiles är redan (medvetet) helt oåtkomlig för
-- anon/authenticated och läses enbart server-side med service-rollnyckeln,
-- se kommentaren i 20260727014500_profiler_och_roller.sql. De nya
-- kolumnerna ärver samma skydd utan vidare åtgärd.

alter table public.profiles
  add column if not exists titel text not null default '',
  add column if not exists aktiv boolean not null default true;

comment on column public.profiles.titel is
  'Fritext för visning i ärende-/bokningstilldelning (t.ex. "IT-tekniker"). Ingen koppling till SystemRoll. Tom sträng faller tillbaka till en roll-baserad standardtitel i applikationslagret.';

comment on column public.profiles.aktiv is
  'Om kontot ska erbjudas som tilldelningsbart för nya ärenden/bokningar. Påverkar inte inloggning eller SystemRoll-behörighet.';
