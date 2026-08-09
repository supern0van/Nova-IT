-- Tar bort de [DEMO]-märkta ärendena och kunderna som seedades i
-- 20260729143000_seed_demo_arenden.sql. De var alltid avsedda som
-- portaltest, inte skarp data - se övergången från mock till riktiga
-- flöden i huvudrepots dokumentation.
--
-- admin_meddelanden och admin_aktiviteter har "on delete cascade" mot
-- admin_arenden (se 20260728165528_admin_operativa_tabeller.sql), så de
-- följer automatiskt med när ärendena tas bort. admin_kunder tas bort sist
-- eftersom admin_arenden.kund_id är "on delete restrict".
--
-- Idempotent: kör man migrationen igen (raderna redan borta) sker inga
-- fel, bara noll träffade rader.

delete from public.admin_arenden
where idempotensnyckel in ('demo-seed-v1-001', 'demo-seed-v1-002', 'demo-seed-v1-003');

delete from public.admin_kunder
where id in (
  '10000000-0000-4000-8000-000000000001'::uuid,
  '10000000-0000-4000-8000-000000000002'::uuid,
  '10000000-0000-4000-8000-000000000003'::uuid
);
