import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RobotMascot } from "./RobotMascot";
import { SupportGuide } from "./SupportGuide";

type SupportBotProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SupportBot({ open, onOpenChange }: SupportBotProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-auto right-3 top-auto bottom-3 max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[430px] translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-2xl border-white/50 bg-white/95 p-0 shadow-[0_28px_90px_rgba(8,28,25,0.28)] backdrop-blur-xl sm:right-5 sm:bottom-5">
        <DialogHeader className="relative overflow-hidden border-b border-emerald-900/20 bg-[#102724] p-4 pr-12 text-left text-white">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/35" />
          <span className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-emerald-300/15 blur-2xl" />
          <div className="flex items-center gap-3">
            <RobotMascot />
            <div>
              <DialogTitle>Nova-guiden</DialogTitle>
              <DialogDescription className="mt-1 text-emerald-100/75">
                Fördefinierade råd, ingen AI och inget skickas.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="h-[min(680px,calc(100dvh-7.5rem))] bg-background">
          <div className="p-3 sm:p-4">
            <SupportGuide compact onNavigate={() => onOpenChange(false)} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
