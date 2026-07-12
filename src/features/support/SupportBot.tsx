import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SupportGuide } from "./SupportGuide";

type SupportBotProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SupportBot({ open, onOpenChange }: SupportBotProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-auto right-3 top-auto bottom-3 max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[430px] translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-lg border-slate-300 bg-[#f4f8fb] p-0 shadow-[0_28px_90px_rgba(2,8,23,0.35)] sm:right-5 sm:bottom-5">
        <DialogHeader className="relative overflow-hidden border-b border-white/10 bg-[#090f15] p-5 pr-12 text-left text-white">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-300 shadow-[0_0_0_5px_rgba(125,211,252,0.12)]" />
            <div>
              <DialogTitle>Nova IT support</DialogTitle>
              <DialogDescription className="mt-1 max-w-sm text-slate-300">
                Berätta vad som händer, så hjälper jag dig till rätt nästa steg.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="h-[min(680px,calc(100dvh-8rem))] bg-[#f4f8fb]">
          <div className="p-3 sm:p-4">
            <SupportGuide compact onNavigate={() => onOpenChange(false)} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
