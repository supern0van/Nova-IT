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
      <DialogContent className="left-auto right-3 top-auto bottom-3 max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[430px] translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-xl border-border p-0 sm:right-5 sm:bottom-5">
        <DialogHeader className="border-b border-emerald-900/20 bg-[#102724] p-4 pr-12 text-left text-white">
          <div className="flex items-center gap-3">
            <RobotMascot />
            <div>
              <DialogTitle>Nova-guiden</DialogTitle>
              <DialogDescription className="mt-1 text-emerald-100/75">
                Förskrivna råd—ingen AI och inget skickas.
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
