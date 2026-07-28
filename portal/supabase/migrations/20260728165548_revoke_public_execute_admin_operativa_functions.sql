-- Samma PUBLIC-EXECUTE-gap som redan åtgärdats för public.profiles
-- (se harden_profiles_rls_and_revoke_public_execute): admin_operativa_tabeller
-- revokerade bara från anon/authenticated, inte PUBLIC, så pseudo-rollen
-- PUBLIC:s default-EXECUTE på nya funktioner kvarstod.

revoke execute on function public.satt_admin_uppdaterad_tidsstampel () from public;
