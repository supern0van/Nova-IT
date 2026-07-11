import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <section className="border-b border-sky-100 bg-[#eef7fb] text-foreground">
      <Container className="grid gap-8 py-16 lg:grid-cols-[1fr_0.72fr] lg:items-end lg:py-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">
            {title}
          </h1>
        </div>
        <div className="border-l-2 border-sky-300 pl-5">
          <p className="text-base leading-7 text-muted-foreground">{intro}</p>
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
        "trust-notice flex items-start gap-3 rounded-md border border-primary/20 bg-primary/5 p-4 text-sm",
        className,
      )}
    >
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p className="leading-6 text-muted-foreground">
        <strong className="font-semibold text-foreground">Trygg ärendestart.</strong> Beskriv
        problemet, välj brådska och låt Nova IT bedöma rätt nästa steg innan större ändringar görs.
      </p>
    </div>
  );
}

export function CTASection({
  title,
  text,
  secondaryTo = "/tjanster",
  secondaryLabel = "Se tjänster",
}: {
  title: string;
  text: string;
  secondaryTo?: "/tjanster" | "/arbetssatt";
  secondaryLabel?: string;
}) {
  return (
    <Container className="py-16">
      <div className="overflow-hidden rounded-lg border border-sky-200 bg-[#eef7fb] px-6 py-10 text-foreground sm:px-10">
        <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="eyebrow">Tydligt nästa steg</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-balance">
              {title}
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">{text}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link to="/kontakt" search={{ service: undefined }}>
                Beskriv ärende <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-sky-300 bg-white text-foreground hover:bg-sky-50 hover:text-foreground"
            >
              <Link to={secondaryTo}>{secondaryLabel}</Link>
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}
