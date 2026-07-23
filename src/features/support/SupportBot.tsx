import { useEffect, useId, useRef, type RefObject } from "react";
import { X } from "lucide-react";
import { SupportGuide } from "./SupportGuide";

type SupportBotProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

export function SupportBot({ open, onOpenChange, triggerRef }: SupportBotProps) {
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onOpenChange(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };

    document.addEventListener("keydown", onKeyDown);
    window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    });
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange, open, triggerRef]);

  if (!open) return null;

  function close() {
    onOpenChange(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={close}
        className="pointer-events-auto absolute inset-0 bg-black/55 sm:hidden"
      />
      <section
        ref={panelRef}
        role="dialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="pointer-events-auto absolute inset-x-0 bottom-0 flex h-[min(700px,calc(100dvh-0.5rem))] flex-col overflow-hidden rounded-t-xl border border-slate-700 bg-[#081018] text-slate-100 shadow-[0_24px_70px_rgba(2,8,23,0.55)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(640px,calc(100dvh-8rem))] sm:w-[390px] sm:rounded-xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 bg-[#071018] px-4 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-sky-300 shadow-[0_0_0_5px_rgba(125,211,252,0.12)]" />
              <h2 id={titleId} className="font-semibold text-white">
                Förbered ärende
              </h2>
            </div>
            <p id={descriptionId} className="mt-1 pl-4 text-xs leading-5 text-slate-400">
              Välj kontaktorsak och samla underlag.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            aria-label="Stäng ärendeguiden"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1">
          <SupportGuide compact onNavigate={close} />
        </div>
      </section>
    </div>
  );
}
