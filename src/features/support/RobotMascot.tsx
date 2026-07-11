import { cn } from "@/lib/utils";

export function RobotMascot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "nova-robot relative grid h-12 w-12 shrink-0 place-items-center rounded-[1.15rem]",
        className,
      )}
    >
      <span className="nova-robot__shadow" />
      <span className="nova-robot__antenna" />
      <span className="nova-robot__head">
        <span className="nova-robot__shine" />
        <span className="nova-robot__ear nova-robot__ear--left" />
        <span className="nova-robot__ear nova-robot__ear--right" />
        <span className="nova-robot__visor">
          <span className="nova-robot__eye" />
          <span className="nova-robot__eye" />
        </span>
        <span className="nova-robot__mouth" />
      </span>
    </span>
  );
}
