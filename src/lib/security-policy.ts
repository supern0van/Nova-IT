export const KUNDPORTAL_ORIGIN = "https://kundportal.nova-it.se";

// Portalmenyn skickar ett top-level POST direkt till kundportalen så att
// lösenord och sessionskakor aldrig passerar nova-it.se:s server.
export const FORM_ACTION_DIRECTIVE = `form-action 'self' ${KUNDPORTAL_ORIGIN}`;
