import { useState } from "react";
import { ArrowUpRight, MessageCircleQuestion } from "lucide-react";
import { SupportBot } from "./SupportBot";

export function SupportBotLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="nova-support-launcher fixed right-4 bottom-4 z-40 flex items-center gap-3 rounded-md border border-white/15 bg-[#090f15] p-2 pr-3 text-left text-white shadow-2xl transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 motion-reduce:transform-none sm:right-6 sm:bottom-6"
        aria-label="Öppna Nova IT-assistenten"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center border border-sky-300/35 bg-sky-300 text-slate-950 shadow-[0_10px_24px_-14px_rgba(125,211,252,0.9)]">
          <MessageCircleQuestion className="h-5 w-5" />
        </span>
        <span className="hidden sm:block">
          <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
            Nova support <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
            Beskriv problemet <ArrowUpRight className="h-4 w-4" />
          </span>
        </span>
      </button>
      <SupportBot open={open} onOpenChange={setOpen} />
    </>
  );
}
