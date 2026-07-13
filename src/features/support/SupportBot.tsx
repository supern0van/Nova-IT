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
      <DialogContent className="left-0 right-0 top-auto bottom-0 h-[min(760px,calc(100dvh-1rem))] w-full max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-t-lg border-slate-700 bg-[#0c1018] p-0 text-slate-100 shadow-[0_28px_90px_rgba(2,8,23,0.55)] sm:left-auto sm:right-6 sm:top-20 sm:bottom-6 sm:h-auto sm:w-[400px] sm:max-w-[calc(100vw-3rem)] sm:rounded-md">
        <DialogHeader className="relative overflow-hidden border-b border-slate-700 bg-[#090f15] p-5 pr-12 text-left text-white">
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
        <ScrollArea className="h-[calc(100%-5.75rem)] bg-[#0c1018] sm:h-[min(680px,calc(100dvh-9rem))]">
          <div className="p-3 sm:p-4">
            <SupportGuide compact onNavigate={() => onOpenChange(false)} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
