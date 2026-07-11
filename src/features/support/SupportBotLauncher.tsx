import { useState } from "react";
import { MessageCircleQuestion } from "lucide-react";
import { SupportBot } from "./SupportBot";
import { RobotMascot } from "./RobotMascot";

export function SupportBotLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="nova-support-launcher fixed right-4 bottom-4 z-40 flex items-center gap-3 rounded-2xl border border-white/15 bg-[#102724] p-2 pr-4 text-left text-white shadow-2xl transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none sm:right-6 sm:bottom-6"
        aria-label="Öppna Nova IT-assistenten"
      >
        <RobotMascot className="h-12 w-12" />
        <span className="hidden sm:block">
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200">
            Behöver du hjälp?
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold">
            Fråga Nova <MessageCircleQuestion className="h-4 w-4" />
          </span>
        </span>
      </button>
      <SupportBot open={open} onOpenChange={setOpen} />
    </>
  );
}
