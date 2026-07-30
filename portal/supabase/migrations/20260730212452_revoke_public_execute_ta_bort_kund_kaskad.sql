-- ta_bort_kund_kaskad var SECURITY DEFINER men saknade grant-begränsning,
-- vilket gjorde funktionen anropbar direkt via Supabase REST/RPC med bara
-- anon- eller authenticated-nyckeln - helt förbi admin-portalens
-- inloggning, MFA och behörighetskontroll. Samma mönster som redan
-- tillämpats för övriga admin-funktioner i
-- 20260728165548_revoke_public_execute_admin_operativa_functions.sql.
revoke execute on function public.ta_bort_kund_kaskad(uuid) from public, anon, authenticated;
