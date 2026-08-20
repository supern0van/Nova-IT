import { useEffect, useId, useRef, type RefObject } from "react";
import { X } from "lucide-react";
import { SupportChat } from "./SupportChat";

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
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
        window.requestAnimationFrame(() => triggerRef.current?.focus());
        return;
      }

      // Enkelt fokusfångst - utan den kan Tab lämna panelen och gå in i
      // resten av sidan bakom den (på desktop är den inte ens täckt av en
      // backdrop, se onPointerDown ovan), vilket bryter mot role="dialog"/
      // aria-modal="true"-kontraktet: en skärmläsare eller tangentbords-
      // användare ska inte kunna navigera ut ur en öppen modal.
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;

      const fokuserbara = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (fokuserbara.length === 0) return;

      const forsta = fokuserbara[0];
      const sista = fokuserbara[fokuserbara.length - 1];

      if (event.shiftKey && document.activeElement === forsta) {
        event.preventDefault();
        sista.focus();
      } else if (!event.shiftKey && document.activeElement === sista) {
        event.preventDefault();
        forsta.focus();
      }
    };

    // Desktop saknade tidigare ett sätt att stänga genom att klicka utanför
    // panelen (bara mobilens backdrop-knapp gjorde det) - täpper till den
    // luckan utan att röra mobilbeteendet, som redan fungerar via
    // backdrop-knappen nedan.
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      onOpenChange(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus();
    });
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
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
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="pointer-events-auto absolute inset-x-0 bottom-0 flex h-[min(700px,calc(100dvh-0.5rem))] flex-col overflow-hidden rounded-t-xl border border-white/12 bg-[#080f17] text-slate-100 shadow-[0_32px_80px_-20px_rgba(2,8,23,0.85)] duration-200 motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:fade-in sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(660px,calc(100dvh-8rem))] sm:w-[400px] sm:rounded-xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 bg-[#060d14] px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.05] p-1.5">
              <img src="/nova-it-mark.svg" alt="" aria-hidden="true" className="h-full w-full" />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="font-semibold leading-tight text-white">
                Nova IT ärendeguide
              </h2>
              <p id={descriptionId} className="mt-1 text-xs leading-5 text-slate-400">
                Automatisk chatt – ingen personal läser här förrän du skickar vidare.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="-mr-1.5 grid h-10 w-10 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            aria-label="Stäng ärendeguiden"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1">
          <SupportChat compact onNavigate={close} />
        </div>
      </section>
    </div>
  );
}
