-- Atomär kaskadborttagning av en kund: bokningar, ärenden, sedan kundraden,
-- i EN transaktion (se taBortOperativKund i lib/admin/operativa-server.ts).
-- Denna fil dokumenterar en funktion som redan applicerades direkt mot den
-- levande databasen 2026-07-30 (migrationsdrift, upptäckt vid säkerhets-
-- granskning 2026-07-30) - texten matchar exakt vad som redan körs live.
create or replace function public.ta_bort_kund_kaskad(p_kund_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  raderade integer;
begin
  delete from public.admin_bokningar where kund_id = p_kund_id;
  delete from public.admin_arenden where kund_id = p_kund_id;
  delete from public.admin_kunder where id = p_kund_id;
  get diagnostics raderade = row_count;

  if raderade = 0 then
    raise exception 'Kunden hittades inte' using errcode = 'P0002';
  end if;
end;
$function$;
