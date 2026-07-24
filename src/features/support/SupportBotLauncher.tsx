import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { MessageCircleQuestion } from "lucide-react";
import { SupportBot } from "./SupportBot";

export function SupportBotLauncher() {
  const [open, setOpen] = useState(false);
  const [nearFooter, setNearFooter] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const footer = document.getElementById("site-footer");
    if (!footer) return;

    const observer = new IntersectionObserver(([entry]) => setNearFooter(entry.isIntersecting), {
      threshold: 0.12,
    });

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  if (pathname === "/assistent") return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={`nova-support-launcher group fixed right-4 z-40 flex h-14 items-center justify-center gap-2 border border-sky-300/35 bg-surface-hero px-4 text-sky-100 shadow-lg transition-[bottom,transform,border-color,background-color] hover:-translate-y-1 hover:border-sky-300 hover:bg-surface-hero-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 motion-reduce:transform-none sm:right-6 ${nearFooter ? "bottom-24 sm:bottom-20" : "bottom-4 sm:bottom-6"}`}
        aria-label="Öppna guiden och förbered ett ärende"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <MessageCircleQuestion className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
        <span className="hidden text-sm font-semibold min-[420px]:inline">Förbered ärende</span>
      </button>
      <SupportBot open={open} onOpenChange={setOpen} triggerRef={triggerRef} />
    </>
  );
}
