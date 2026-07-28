-- Härdning av public.profiles och dess funktioner efter Supabase Advisor-varning.
--
-- Del A: applicerar RLS-härdningen som redan fanns skriven i
--   20260728153518_harden_profiles_rls.sql, men som verifierats (via
--   pg_class.relrowsecurity) INTE ha varit applicerad live innan denna
--   migration kördes.
--
-- Del B: täcker ett gap som ingen tidigare migration adresserade. Både denna
-- fil och 20260727014500_profiler_och_roller.sql återkallade EXECUTE från
-- `anon, authenticated` explicit, men Postgres beviljar EXECUTE på nya
-- funktioner till pseudo-rollen PUBLIC som standard. `anon`/`authenticated`
-- ärver därför EXECUTE via PUBLIC oavsett de riktade REVOKE-satserna, om inte
-- PUBLIC självt återkallas separat. Verifierat live via
-- information_schema.routine_privileges innan och efter denna migration.

alter table public.profiles enable row level security;

create or replace function public.satt_profil_uppdaterad_tidsstampel()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.uppdaterad = now();
  return new;
end;
$$;

revoke all on public.profiles from anon, authenticated;
revoke all on function public.satt_profil_uppdaterad_tidsstampel () from anon, authenticated;

revoke execute on function public.hantera_ny_anvandare () from public;
revoke execute on function public.satt_profil_uppdaterad_tidsstampel () from public;
