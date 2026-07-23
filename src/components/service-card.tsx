import type { Service } from "@/lib/nova-data";

export function ServiceCard({ service }: { service: Service }) {
  const Icon = service.icon;

  return (
    <article className="group flex h-full gap-4 border-t border-white/10 py-6 first:border-t-0 sm:py-7">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-sky-300/15 bg-sky-300/8 text-sky-200">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-200/70">
          {service.category}
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-normal text-white">{service.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">{service.description}</p>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          <span className="font-medium text-slate-200">Exempel: </span>
          {service.examples.slice(0, 2).join(", ")}.
        </p>
      </div>
    </article>
  );
}
