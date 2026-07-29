-- Tydligt märkta demoärenden för portalens genomgång.
-- De är avsiktligt separerade från riktiga intag genom [DEMO]-prefix och
-- stabila idempotensnycklar. De ska aldrig användas som kundkommunikation.

insert into public.admin_kunder (id, namn, kundtyp, organisation, epost, telefon, adress, ort)
select '10000000-0000-4000-8000-000000000001'::uuid, 'Demo Kund – Anna Test', 'privatperson', null,
  'demo.anna@example.invalid', '070-000 00 01', 'Demo­gatan 1', 'Stockholm'
where not exists (select 1 from public.admin_kunder where id = '10000000-0000-4000-8000-000000000001'::uuid);

insert into public.admin_kunder (id, namn, kundtyp, organisation, epost, telefon, adress, ort)
select '10000000-0000-4000-8000-000000000002'::uuid, 'Demo Kund – Nord Test AB', 'verksamhet', 'Nord Test AB',
  'demo.nord@example.invalid', '08-000 00 02', 'Testvägen 2', 'Solna'
where not exists (select 1 from public.admin_kunder where id = '10000000-0000-4000-8000-000000000002'::uuid);

insert into public.admin_kunder (id, namn, kundtyp, organisation, epost, telefon, adress, ort)
select '10000000-0000-4000-8000-000000000003'::uuid, 'Demo Kund – Lisa Test', 'privatperson', null,
  'demo.lisa@example.invalid', '070-000 00 03', 'Exempelvägen 3', 'Uppsala'
where not exists (select 1 from public.admin_kunder where id = '10000000-0000-4000-8000-000000000003'::uuid);

insert into public.admin_arenden (
  id, arendenummer, rubrik, kund_id, kund_namn, kundtyp, organisation, epost, telefon,
  kategori, underkategori, status, prioritet, ansvarig_id, kanal, beskrivning,
  idempotensnyckel
)
select
  v.id, v.arendenummer, v.rubrik, k.id, k.namn, k.kundtyp, k.organisation, k.epost, k.telefon,
  v.kategori::public.admin_kategori, v.underkategori, v.status::public.admin_arende_status,
  v.prioritet::public.admin_prioritet,
  coalesce(
    (select p.id::text from public.profiles p where lower(p.epost) = 'support@nova-it.se' and p.aktiv = true limit 1),
    (select p.id::text from public.profiles p where p.roll = 'administrator' and p.aktiv = true order by p.epost limit 1)
  ),
  v.kanal::public.admin_kanal, v.beskrivning, v.idempotensnyckel
from (
  values
    ('20000000-0000-4000-8000-000000000001'::uuid, 'NIT-DEMO-001', '[DEMO] Ny kontaktförfrågan', '10000000-0000-4000-8000-000000000001'::uuid, 'datorer_vardags_it', 'Prestanda', 'ny', 'normal', 'kontaktformular', 'Detta är ett märkt demoärende för att kontrollera nyinkomna kontaktförfrågningar i dashboarden.', 'demo-seed-v1-001'),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'NIT-DEMO-002', '[DEMO] Nätverksproblem', '10000000-0000-4000-8000-000000000002'::uuid, 'natverk_wifi', 'Trådlöst nätverk', 'ny', 'hog', 'telefon', 'Detta är ett märkt demoärende för att kontrollera supportarbete.', 'demo-seed-v1-002'),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'NIT-DEMO-003', '[DEMO] Planerad installation', '10000000-0000-4000-8000-000000000003'::uuid, 'installation', 'Programinstallation', 'ny', 'lag', 'e-post', 'Detta är ett märkt demoärende för att kontrollera väntande kundsvar.', 'demo-seed-v1-003')
) as v(id, arendenummer, rubrik, kund_id, kategori, underkategori, status, prioritet, kanal, beskrivning, idempotensnyckel)
join public.admin_kunder k on k.id = v.kund_id
where not exists (
  select 1 from public.admin_arenden a where a.idempotensnyckel = v.idempotensnyckel
);

insert into public.admin_meddelanden (arende_id, avsandare, avsandare_namn, text, internt)
select a.id, 'kund', a.kund_namn, a.beskrivning, false
from public.admin_arenden a
where a.idempotensnyckel in ('demo-seed-v1-001', 'demo-seed-v1-002', 'demo-seed-v1-003')
  and not exists (select 1 from public.admin_meddelanden m where m.arende_id = a.id);

insert into public.admin_aktiviteter (arende_id, typ, beskrivning, aktor)
select a.id, 'skapat', 'DEMO: ärendet skapades för portaltest', 'Seed för demo'
from public.admin_arenden a
where a.idempotensnyckel in ('demo-seed-v1-001', 'demo-seed-v1-002', 'demo-seed-v1-003')
  and not exists (
    select 1 from public.admin_aktiviteter x where x.arende_id = a.id and x.aktor = 'Seed för demo'
  );

comment on column public.admin_arenden.idempotensnyckel is
  'Stabil nyckel från publikt intag. Prefixet demo-seed- används enbart för tydligt märkta portaltestärenden.';
