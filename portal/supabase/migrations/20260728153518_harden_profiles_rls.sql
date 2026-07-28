-- Härdning av profiles efter Supabase Advisor-varning.
--
-- public.profiles var redan låst för anon/authenticated via REVOKE och läses
-- endast server-side med service-role. RLS aktiveras ändå här som defense in
-- depth, så att en framtida felaktig GRANT inte råkar exponera rader via Data
-- API:t.

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
