import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export function RobotMascot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-emerald-200/70 bg-emerald-100 text-[#0d5b4f] shadow-sm",
        className,
      )}
    >
      <span className="absolute -top-1 h-2.5 w-px bg-emerald-700" />
      <span className="absolute -top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
      <Bot className="h-6 w-6" />
    </span>
  );
}
