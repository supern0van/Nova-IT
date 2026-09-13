import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { MessageCircleQuestion } from "lucide-react";
import { SupportBot } from "./SupportBot";
import { SUPPORT_ASSISTANT_IS_ONLINE } from "./support-availability";

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

  if (!SUPPORT_ASSISTANT_IS_ONLINE || pathname === "/assistent") return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        // bottom-offsetten lägger alltid till --nova-cookie-banner-h (satt av
        // CookieConsent, 0px när den är stängd/borta) ovanpå det vanliga
        // avståndet - annars döljs launchern helt bakom kakbannerns sidbreda
        // rad (samma z-lager, launchern förlorar) tills besökaren stänger den.
        className={`nova-support-launcher group fixed right-4 z-40 flex h-13 items-center justify-center gap-2.5 rounded-full border border-white/12 bg-[#0b131c] px-5 text-slate-100 transition-[bottom,transform,border-color,background-color] hover:-translate-y-0.5 hover:border-sky-300/60 hover:bg-[#101a24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d151e] motion-reduce:transform-none sm:right-6 ${nearFooter ? "bottom-[calc(6rem+var(--nova-cookie-banner-h,0px))] sm:bottom-[calc(5rem+var(--nova-cookie-banner-h,0px))]" : "bottom-[calc(1rem+var(--nova-cookie-banner-h,0px))] sm:bottom-[calc(1.5rem+var(--nova-cookie-banner-h,0px))]"}`}
        aria-label="Öppna ärendeguiden"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <MessageCircleQuestion className="h-5 w-5 text-sky-300 transition-transform duration-200 group-hover:scale-110" />
        <span className="hidden text-sm font-semibold min-[420px]:inline">Fråga oss</span>
      </button>
      <SupportBot open={open} onOpenChange={setOpen} triggerRef={triggerRef} />
    </>
  );
}
