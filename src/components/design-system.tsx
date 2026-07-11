import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, CircleDot, ShieldCheck } from "lucide-react";
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
    <section className="tech-grid-dark border-b border-[#1f4c46] bg-[#102724] text-white">
      <Container className="grid gap-8 py-16 lg:grid-cols-[1fr_0.72fr] lg:items-end lg:py-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">
            {title}
          </h1>
        </div>
        <div className="border-l-2 border-emerald-300/60 pl-5 [&_.trust-notice]:border-white/20 [&_.trust-notice]:bg-white/8 [&_.trust-notice_p]:text-slate-200 [&_.trust-notice_strong]:text-white">
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

export function StatusPanel() {
  const checks = ["Gäller flera enheter", "Router omstartad", "Problemet återkommer"];

  return (
    <div className="operational-shadow overflow-hidden rounded-lg border border-slate-700 bg-[#102724] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
            Exempelärende
          </p>
          <p className="mt-1 font-semibold">Instabilt Wi-Fi i mötesrum</p>
        </div>
        <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-xs font-medium text-amber-100">
          Behöver sorteras
        </span>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Kategori</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium">
            <CircleDot className="h-4 w-4 text-emerald-300" /> Nätverk och Wi-Fi
          </p>
          <p className="mt-5 text-xs uppercase tracking-[0.14em] text-slate-400">Status</p>
          <div className="mt-2 flex items-center gap-1" aria-label="Två av tre kontroller klara">
            <span className="h-1.5 flex-1 rounded-full bg-emerald-300" />
            <span className="h-1.5 flex-1 rounded-full bg-emerald-300" />
            <span className="h-1.5 flex-1 rounded-full bg-white/15" />
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Första kontroller</p>
          <ul className="mt-3 space-y-2">
            {checks.map((check, index) => (
              <li key={check} className="flex items-center gap-2 text-sm text-slate-200">
                <CheckCircle2
                  className={cn("h-4 w-4", index < 2 ? "text-emerald-300" : "text-slate-500")}
                />
                {check}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 bg-white/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Nästa steg</p>
          <p className="mt-1 text-sm text-slate-100">Samla plats, tidpunkt och berörda enheter.</p>
        </div>
        <Button asChild size="sm" className="bg-emerald-300 text-slate-950 hover:bg-emerald-200">
          <Link to="/kontakt" search={{ service: "natverk" }}>
            Förbered ärende <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
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
      <div className="tech-grid overflow-hidden rounded-lg border border-primary/20 bg-[#102724] px-6 py-10 text-white sm:px-10">
        <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="eyebrow text-emerald-200">Tydligt nästa steg</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-balance">
              {title}
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-300">{text}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="bg-emerald-300 text-slate-950 hover:bg-emerald-200">
              <Link to="/kontakt" search={{ service: undefined }}>
                Beskriv ärende <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to={secondaryTo}>{secondaryLabel}</Link>
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}
