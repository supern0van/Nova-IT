import { Link } from "@tanstack/react-router";
import { LockKeyhole, Send, UserRound } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { SupportServiceSlug, SupportUrgency } from "../support-types";

const MAX_LENGTH = 800;
/** Räknaren syns bara nära gränsen - Intercom-stilens sparsamhet, inte
 *  ständigt synligt "0/800"-klutter. */
const SHOW_COUNTER_FROM = Math.round(MAX_LENGTH * 0.7);

type EscalationProps = {
  urgency: SupportUrgency;
  serviceSlug: SupportServiceSlug | null;
  onClick: () => void;
};

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  disabled,
  inputId,
  escalation,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  inputId: string;
  /** Alltid tillgänglig väg till en människa - visas som en diskret länk i
   *  footern i stället för att ligga inne i konversationshistoriken (se
   *  SupportChat.tsx för varför). */
  escalation?: EscalationProps;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-växande textarea utan något extra beroende - sätter höjden till
  // scrollHeight varje gång innehållet ändras.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  return (
    <form
      className="border-t border-white/10 bg-[#080f17] p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled) onSubmit();
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Skriv ett meddelande
      </label>
      <div className="flex min-w-0 items-end gap-2">
        <Textarea
          ref={textareaRef}
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!disabled && value.trim()) onSubmit();
            }
          }}
          placeholder="Skriv din fråga…"
          rows={1}
          maxLength={MAX_LENGTH}
          disabled={disabled}
          className="min-h-11 min-w-0 resize-none border-white/12 bg-[#060d14] text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-300"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Skicka meddelandet"
          disabled={disabled || !value.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 flex items-start justify-between gap-3">
        <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
          <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Skriv inte lösenord, personnummer eller bankuppgifter.
        </p>
        <p
          className={cn(
            "shrink-0 text-[11px] tabular-nums text-slate-500",
            value.length < SHOW_COUNTER_FROM && "sr-only",
          )}
        >
          {value.length}/{MAX_LENGTH}
        </p>
      </div>
      {escalation && (
        <Link
          to="/kontakt"
          search={{ form: "request", service: escalation.serviceSlug ?? undefined }}
          onClick={escalation.onClick}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          <UserRound className="h-3.5 w-3.5" />
          {escalation.urgency === "standard"
            ? "Prata med en människa istället"
            : "Kontakta Nova IT direkt"}
        </Link>
      )}
    </form>
  );
}
