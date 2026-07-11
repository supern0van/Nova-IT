import type { Service } from "@/lib/nova-data";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

const difficultyStyles: Record<Service["difficulty"], string> = {
  Start: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Standard: "border-sky-200 bg-sky-50 text-sky-800",
  Fördjupad: "border-amber-200 bg-amber-50 text-amber-900",
};

export function ServiceCard({ service, compact = false }: { service: Service; compact?: boolean }) {
  const Icon = service.icon;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg focus-within:border-primary/45">
      <div className="h-1 bg-primary/15 transition-colors group-hover:bg-primary" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-primary/15 bg-primary/7 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${difficultyStyles[service.difficulty]}`}
          >
            {service.difficulty}
          </span>
        </div>

        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {service.category}
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">{service.title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.description}</p>

        {!compact && (
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Vanliga ärenden
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {service.examples.map((example) => (
                <li key={example} className="flex gap-2 text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {example}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 rounded-md bg-secondary/65 p-4">
          <p className="flex gap-2 text-sm font-medium leading-6">
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
            {service.outcome}
          </p>
        </div>

        <Button asChild variant="outline" className="mt-6 w-full justify-between">
          <Link
            to="/kontakt"
            search={{ service: service.slug }}
            aria-label={`Beskriv ärende för ${service.title}`}
          >
            Beskriv ärendet <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
