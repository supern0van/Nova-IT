import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  intro,
  aside,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  aside?: ReactNode;
}) {
  return (
    <section className="nova-page-header">
      <Container
        className={cn(
          "py-14 lg:py-18",
          aside && "grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end",
        )}
      >
        <div className={cn(!aside && "max-w-3xl")}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal text-balance sm:text-5xl lg:text-6xl">
            {title}
          </h1>
        </div>
        <div className={cn(!aside && "mt-5 max-w-2xl")}>
          <p className="text-base leading-7 text-slate-300">{intro}</p>
          {aside}
        </div>
      </Container>
    </section>
  );
}

export function TrustNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "trust-notice flex items-start gap-3 rounded-md border border-sky-300/25 bg-sky-300/8 p-4 text-sm",
        className,
      )}
    >
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p className="leading-6 text-muted-foreground">
        <strong className="font-semibold text-foreground">En tydlig första kontakt.</strong> Berätta
        vad som krånglar så bedömer vi vilken fortsatt hjälp eller åtgärd som är rimlig.
      </p>
    </div>
  );
}
