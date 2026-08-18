import { ShieldAlert } from "lucide-react";

/**
 * Säkerhetsvarningen vid misstänkt intrång/säkerhetsincident. HÅRDKODAD
 * COPY, alltid - triggas bara av den nyckelordsbaserade regelmotorn
 * (`support-engine.ts`) eller av att modellen flaggat `securityIncident`,
 * men texten som visas kommer ALDRIG från modellens fria svar. Det är den
 * enda ytan i hela chatten som är provbart icke-AI-genererad, och den ska
 * förbli det - se `support-chat-server.ts` för hur `securityIncident`
 * beräknas (regelmotorn vinner alltid).
 */
export function SafetyNotice() {
  return (
    <div
      role="alert"
      className="ml-10 rounded-lg border border-rose-400/30 bg-rose-400/[0.08] p-5 text-sm text-rose-50"
    >
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Hör av dig så snart du kan</p>
          <p className="mt-1.5 leading-6 opacity-90">
            Fortsätt inte klicka, logga in eller göra större ändringar på den berörda enheten under
            tiden.
          </p>
        </div>
      </div>
    </div>
  );
}
