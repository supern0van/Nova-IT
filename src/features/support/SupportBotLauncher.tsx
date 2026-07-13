import { useState } from "react";
import { MessageCircleQuestion } from "lucide-react";
import { SupportBot } from "./SupportBot";

export function SupportBotLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="nova-support-launcher group fixed right-4 bottom-4 z-40 grid h-14 w-14 place-items-center border border-sky-300/35 bg-[#090f15] text-sky-100 transition-all hover:-translate-y-1 hover:border-sky-300 hover:bg-[#101a24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 motion-reduce:transform-none sm:right-6 sm:bottom-6"
        aria-label="Öppna Nova IT-assistenten"
        title="Behöver du hjälp?"
      >
        <MessageCircleQuestion className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
      </button>
      <SupportBot open={open} onOpenChange={setOpen} />
    </>
  );
}
