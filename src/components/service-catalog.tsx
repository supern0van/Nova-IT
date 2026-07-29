import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Service } from "@/lib/nova-data";

export function ServiceCatalog({ services }: { services: Service[] }) {
  return (
    <div className="border-t border-white/12">
      {services.map((service) => (
        <article
          key={service.slug}
          className="grid gap-6 border-b border-white/12 py-8 sm:py-10 lg:grid-cols-[1.3fr_1fr] lg:gap-10"
        >
          <div>
            <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-xl font-semibold tracking-normal text-white sm:text-2xl">
                {service.title}
              </span>
              <span className="text-sm text-slate-400">{service.outcome}</span>
            </span>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{service.description}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Vanliga situationer
            </p>
            <ul className="mt-3 space-y-2">
              {service.examples.map((example) => (
                <li key={example} className="flex gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                  <span>{example}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button asChild className="bg-sky-400 text-slate-950 hover:bg-sky-300">
                <Link to="/kontakt" search={{ form: "request", service: service.slug }}>
                  Beskriv ärendet <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Link
                to="/tjanster/$slug"
                params={{ slug: service.slug }}
                className="text-sm font-medium text-sky-300 transition-colors hover:text-sky-200"
              >
                Läs mer om tjänsten
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
