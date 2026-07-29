-- ══════════════════════════════════════════════════════════════════════════
-- Ny aktivitetstyp: sms
-- ══════════════════════════════════════════════════════════════════════════
--
-- Lägger till 'sms' i admin_aktivitet_typ så att ett SMS-utskick till kund
-- (t.ex. "ärendet är klart för upphämtning", se lib/admin/sms-server.ts)
-- kan loggas i admin_aktiviteter precis som status-, prioritets- och
-- tilldelningsändringar redan gör.
--
-- ALTER TYPE ... ADD VALUE kan inte köras inuti samma transaktion som
-- efterföljande användning av värdet, men det är aldrig ett problem här
-- eftersom varje migrationsfil körs för sig.

alter type public.admin_aktivitet_typ add value if not exists 'sms';
