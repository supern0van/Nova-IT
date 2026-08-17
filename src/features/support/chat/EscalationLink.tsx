import { Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import type { SupportServiceSlug, SupportUrgency } from "../support-types";

/**
 * Alltid tillgänglig väg till en människa - synlig genom HELA
 * konversationen, inte bara efter ett avslutat flöde. Direkt uppföljning av
 * researchunderlaget om eskalering: en användare ska aldrig behöva ge upp
 * innan den hittar vägen vidare.
 */
export function EscalationLink({
  serviceSlug,
  urgency,
  onBeforeNavigate,
}: {
  serviceSlug: SupportServiceSlug | null;
  urgency: SupportUrgency;
  /** Bygger och sparar ett `SupportHandoff` (se `support-handoff.ts`) innan
   *  navigeringen sker - samma återanvända, validerade format som den gamla
   *  guiden redan använde, bara fyllt med chattens kontext i stället för
   *  klick-flödets. */
  onBeforeNavigate?: () => void;
}) {
  return (
    <Link
      to="/kontakt"
      search={{ form: "request", service: serviceSlug ?? undefined }}
      onClick={onBeforeNavigate}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
    >
      <UserRound className="h-3.5 w-3.5" />
      {urgency === "standard" ? "Prata med en människa istället" : "Kontakta Nova IT direkt"}
    </Link>
  );
}
