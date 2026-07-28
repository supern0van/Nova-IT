-- Ersätter app-side "SELECT MAX + 1" för arendenummer med en atomär
-- Postgres-sekvens, för att eliminera race-fönstret vid parallella
-- ärendeskapanden (tidigare mildrat med app-side retry vid 23505).
-- Startvärde matchar den högsta befintliga NIT-xxxx-serien i admin_arenden
-- plus marginal, så sekvensen aldrig krockar med befintliga rader.

create sequence if not exists public.admin_arendenummer_seq start 2501;

create or replace function public.nasta_admin_arendenummer()
returns text
language sql
set search_path = public
as $$
  select 'NIT-' || nextval('public.admin_arendenummer_seq')::text;
$$;

revoke all on function public.nasta_admin_arendenummer () from anon, authenticated;
revoke execute on function public.nasta_admin_arendenummer () from public;
revoke all on sequence public.admin_arendenummer_seq from anon, authenticated, public;
