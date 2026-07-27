/**
 * Driftstatus för admininställningar som ännu saknar serverlagring.
 *
 * Systemroll/profiler och MFA-flöden är verkligt kopplade mot Supabase.
 * Aviseringar, mottagare, kategorier och standardsvar saknar däremot ännu
 * beslutad datamodell, så de ska inte låtsas vara produktionsskrivbara.
 */
export const adminKonfigurationEjKoppladText =
  'Den här konfigurationen är inte driftkopplad ännu. Den visas som underlag, men ändras först när backendtabeller och e-postflöde är beslutade.'
