-- ══════════════════════════════════════════════════════════════════════════
-- Operativa tabeller för Nova IT:s adminportal
-- ══════════════════════════════════════════════════════════════════════════
--
-- Syfte: ersätta localStorage-/demolagret för ärenden, kunder och bokningar
-- med riktiga Postgres-tabeller, utan att ändra MFA/AAL2- eller rollmodellen.
--
-- Åtkomstmodell:
--   * Tabellen ligger i public men är INTE klientåtkomlig.
--   * RLS är aktiverad som defense-in-depth.
--   * anon/authenticated får inga privilegier.
--   * Adminportalen går via skyddade Next Route Handlers + service role,
--     samma fail-closed-mönster som public.profiles.

create type public.admin_kundtyp as enum ('privatperson', 'verksamhet');
create type public.admin_arende_status as enum ('ny', 'pagaende', 'vantar_pa_kund', 'bokad', 'lost', 'stangd');
create type public.admin_prioritet as enum ('lag', 'normal', 'hog', 'kritisk');
create type public.admin_kategori as enum (
  'datorer_vardags_it',
  'natverk_wifi',
  'konton_moln_sakerhet',
  'installation',
  'sakerhet_virus'
);
create type public.admin_kanal as enum ('kontaktformular', 'supportassistent', 'telefon', 'e-post');
create type public.admin_meddelande_avsandare as enum ('kund', 'personal', 'assistent');
create type public.admin_aktivitet_typ as enum (
  'skapat',
  'status',
  'prioritet',
  'tilldelning',
  'meddelande',
  'anteckning',
  'bokning',
  'bilaga'
);
create type public.admin_bokning_typ as enum ('hembesok', 'distanssupport', 'verkstadsbesok', 'telefonkontakt');
create type public.admin_bokning_status as enum ('planerad', 'bekraftad', 'genomford', 'avbokad');

create table public.admin_kunder (
  id uuid primary key default gen_random_uuid(),
  namn text not null check (char_length(trim(namn)) between 2 and 160),
  kundtyp public.admin_kundtyp not null,
  organisation text,
  orgnummer text,
  epost text not null check (char_length(trim(epost)) between 3 and 254),
  telefon text not null check (char_length(trim(telefon)) between 3 and 40),
  adress text not null default '',
  ort text not null default '',
  kontaktperson text,
  senaste_kontakt timestamptz not null default now(),
  skapad timestamptz not null default now(),
  uppdaterad timestamptz not null default now()
);

create table public.admin_arenden (
  id uuid primary key default gen_random_uuid(),
  arendenummer text not null unique,
  rubrik text not null check (char_length(trim(rubrik)) between 3 and 180),
  kund_id uuid not null references public.admin_kunder (id) on delete restrict,
  kund_namn text not null,
  kundtyp public.admin_kundtyp not null,
  organisation text,
  epost text not null,
  telefon text not null,
  kategori public.admin_kategori not null,
  underkategori text not null default '',
  status public.admin_arende_status not null default 'ny',
  prioritet public.admin_prioritet not null default 'normal',
  ansvarig_id text,
  kanal public.admin_kanal not null,
  beskrivning text not null check (char_length(trim(beskrivning)) >= 5),
  assistent_sammanfattning text,
  bilagor jsonb not null default '[]'::jsonb,
  skapad timestamptz not null default now(),
  uppdaterad timestamptz not null default now(),
  sista_svar timestamptz
);

create table public.admin_meddelanden (
  id uuid primary key default gen_random_uuid(),
  arende_id uuid not null references public.admin_arenden (id) on delete cascade,
  avsandare public.admin_meddelande_avsandare not null,
  avsandare_namn text not null,
  text text not null check (char_length(trim(text)) > 0),
  tidpunkt timestamptz not null default now(),
  internt boolean not null default false
);

create table public.admin_aktiviteter (
  id uuid primary key default gen_random_uuid(),
  arende_id uuid not null references public.admin_arenden (id) on delete cascade,
  typ public.admin_aktivitet_typ not null,
  beskrivning text not null,
  aktor text not null,
  tidpunkt timestamptz not null default now()
);

create table public.admin_bokningar (
  id uuid primary key default gen_random_uuid(),
  arende_id uuid references public.admin_arenden (id) on delete set null,
  arendenummer text,
  kund_id uuid not null references public.admin_kunder (id) on delete restrict,
  kund_namn text not null,
  typ public.admin_bokning_typ not null,
  status public.admin_bokning_status not null default 'planerad',
  datum date not null,
  tid time not null,
  langd_minuter integer not null default 60 check (langd_minuter between 15 and 480),
  tekniker text not null,
  plats text not null default '',
  notering text,
  skapad timestamptz not null default now(),
  uppdaterad timestamptz not null default now()
);

create table public.admin_kundanteckningar (
  id uuid primary key default gen_random_uuid(),
  kund_id uuid not null references public.admin_kunder (id) on delete cascade,
  text text not null check (char_length(trim(text)) > 0),
  forfattare text not null,
  skapad timestamptz not null default now(),
  uppdaterad timestamptz
);

create index admin_arenden_kund_id_idx on public.admin_arenden (kund_id);
create index admin_arenden_status_idx on public.admin_arenden (status);
create index admin_arenden_uppdaterad_idx on public.admin_arenden (uppdaterad desc);
create index admin_bokningar_kund_datum_idx on public.admin_bokningar (kund_id, datum);
create index admin_bokningar_arende_id_idx on public.admin_bokningar (arende_id);
create index admin_meddelanden_arende_tidpunkt_idx on public.admin_meddelanden (arende_id, tidpunkt);
create index admin_aktiviteter_arende_tidpunkt_idx on public.admin_aktiviteter (arende_id, tidpunkt desc);
create index admin_kundanteckningar_kund_skapad_idx on public.admin_kundanteckningar (kund_id, skapad desc);

create or replace function public.satt_admin_uppdaterad_tidsstampel()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.uppdaterad = now();
  return new;
end;
$$;

create trigger admin_kunder_satt_uppdaterad
before update on public.admin_kunder
for each row execute function public.satt_admin_uppdaterad_tidsstampel();

create trigger admin_arenden_satt_uppdaterad
before update on public.admin_arenden
for each row execute function public.satt_admin_uppdaterad_tidsstampel();

create trigger admin_bokningar_satt_uppdaterad
before update on public.admin_bokningar
for each row execute function public.satt_admin_uppdaterad_tidsstampel();

alter table public.admin_kunder enable row level security;
alter table public.admin_arenden enable row level security;
alter table public.admin_meddelanden enable row level security;
alter table public.admin_aktiviteter enable row level security;
alter table public.admin_bokningar enable row level security;
alter table public.admin_kundanteckningar enable row level security;

revoke all on public.admin_kunder from anon, authenticated;
revoke all on public.admin_arenden from anon, authenticated;
revoke all on public.admin_meddelanden from anon, authenticated;
revoke all on public.admin_aktiviteter from anon, authenticated;
revoke all on public.admin_bokningar from anon, authenticated;
revoke all on public.admin_kundanteckningar from anon, authenticated;
revoke all on function public.satt_admin_uppdaterad_tidsstampel () from anon, authenticated;
