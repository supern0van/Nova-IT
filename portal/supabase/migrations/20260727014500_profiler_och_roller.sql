-- ══════════════════════════════════════════════════════════════════════════
-- Profiler och systemroller för Nova IT:s adminportal
-- ══════════════════════════════════════════════════════════════════════════
--
-- Denna systemroll (`administrator` / `medarbetare`) styr vad en inloggad
-- portalanvändare FÅR GÖRA i systemet. Den är fristående från portalens
-- befintliga personal-/teknikerroll (`Roll` i `lib/types.ts`,
-- 'administrator' | 'tekniker'), som beskriver personal i ärende-/
-- bokningstilldelningen och INTE ändras av den här migrationen. Se
-- motsvarande TypeScript-typ `SystemRoll` i `lib/auth/roll.ts`.
--
-- SÄKERHET UTAN RLS (medvetet, RLS är exkluderat ur detta uppdrag):
-- Row Level Security aktiveras INTE på `profiles` i det här steget. Istället
-- återkallas alla privilegier för `anon`/`authenticated` explicit nedan, så
-- att tabellen är helt oåtkomlig via PostgREST/klienten oavsett projektets
-- schemastandarder. All läsning sker på servern med service-rollnyckeln (se
-- `lib/supabase/service.ts`), vilket är hur kravet "servern ska inte lita på
-- klientens roll" uppfylls utan RLS-policyer. RLS rekommenderas ändå som
-- försvar-på-djupet i ett senare steg – se teknisk skuld i slutrapporten.

create type public.system_roll as enum ('administrator', 'medarbetare');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  epost text not null,
  namn text not null default '',
  roll public.system_roll not null default 'medarbetare',
  skapad timestamptz not null default now(),
  uppdaterad timestamptz not null default now()
);

comment on table public.profiles is
  'En rad per Supabase Auth-användare. Källa för portalens systemroll (`roll`, se SystemRoll i lib/auth/roll.ts) – inte samma sak som personal-/teknikerrollen i lib/types.ts. Ingen RLS: tabellen är avsiktligt oåtkomlig för anon/authenticated, se revoke-satserna nedan. Läses endast av servern via service-rollnyckeln.';

-- Håll `uppdaterad` korrekt utan att applikationskoden behöver komma ihåg det.
create or replace function public.satt_profil_uppdaterad_tidsstampel()
returns trigger
language plpgsql
as $$
begin
  new.uppdaterad = now();
  return new;
end;
$$;

create trigger profiles_satt_uppdaterad
before update on public.profiles
for each row
execute function public.satt_profil_uppdaterad_tidsstampel();

-- Automatiskt profilskapande vid ny användare – Supabases rekommenderade
-- mönster (trigger på auth.users, SECURITY DEFINER eftersom auth.users och
-- public.profiles annars inte är skrivbara av den inloggande rollen).
-- Se: https://supabase.com/docs/guides/auth/managing-user-data
create or replace function public.hantera_ny_anvandare()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, epost, namn, roll)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'namn', ''), split_part(coalesce(new.email, ''), '@', 1)),
    'medarbetare'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.hantera_ny_anvandare();

-- Backfill: befintliga användare (skapade innan denna migration) saknar
-- annars profil eftersom triggern bara körs på FRAMTIDA inserts i auth.users.
insert into public.profiles (id, epost, namn, roll)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(nullif(u.raw_user_meta_data ->> 'namn', ''), split_part(coalesce(u.email, ''), '@', 1)),
  'medarbetare'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- Ingen RLS i det här steget (se motivering ovan) – men klienten ska ändå
-- aldrig kunna nå tabellen direkt via PostgREST, oavsett projektets
-- schema-standardprivilegier. Endast service_role (servern) kommer åt den.
revoke all on public.profiles from anon, authenticated;
revoke all on function public.hantera_ny_anvandare () from anon, authenticated;
revoke all on function public.satt_profil_uppdaterad_tidsstampel () from anon, authenticated;
