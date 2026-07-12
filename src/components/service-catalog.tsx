import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { Service } from "@/lib/nova-data";

export function ServiceCatalog({ services }: { services: Service[] }) {
  return (
    <div className="border-t border-white/12">
      {services.map((service, index) => (
        <Link
          key={service.slug}
          to="/kontakt"
          search={{ service: service.slug }}
          className="group grid gap-4 border-b border-white/12 py-6 transition-colors hover:bg-white/[0.035] focus-visible:bg-white/[0.035] focus-visible:outline-none sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-start sm:gap-6 sm:py-8"
        >
          <span className="pt-1 font-mono text-xs text-sky-300/80">
            {String(index + 1).padStart(2, "0")}
          </span>
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
          </span>
          <ArrowUpRight className="h-5 w-5 text-slate-500 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-sky-300 sm:mt-1" />
        </Link>
      ))}
    </div>
  );
}
