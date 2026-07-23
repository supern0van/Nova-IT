import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Service } from "@/lib/nova-data";

export function ServiceCatalog({ services }: { services: Service[] }) {
  return (
    <div className="border-t border-white/12">
      {services.map((service) => (
        <article key={service.slug} className="grid gap-4 border-b border-white/12 py-6 sm:py-8">
          <span>
            <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-xl font-semibold tracking-normal text-white sm:text-2xl">
                {service.title}
              </span>
              <span className="text-sm text-slate-400">{service.outcome}</span>
            </span>
            <span className="mt-3 block max-w-2xl text-sm leading-6 text-slate-300">
              {service.description}
            </span>
            <Link
              to="/tjanster/$slug"
              params={{ slug: service.slug }}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-300 transition-colors hover:text-sky-200"
            >
              Läs mer om tjänsten <ArrowRight className="h-4 w-4" />
            </Link>
          </span>
        </article>
      ))}
    </div>
  );
}
