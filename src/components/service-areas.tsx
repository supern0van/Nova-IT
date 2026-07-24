import { serviceAreas } from "@/lib/nova-data";

export function ServiceAreas({ compact = false }: { compact?: boolean }) {
  if (!compact) {
    return (
      <div className="border-y border-white/12">
        {serviceAreas.map((area) => (
          <article
            key={area.title}
            className="grid gap-1 border-b border-white/12 py-4 last:border-b-0 sm:grid-cols-[minmax(14rem,0.8fr)_minmax(0,1.2fr)] sm:items-baseline sm:gap-8"
          >
            <h3 className="text-lg font-semibold tracking-normal text-white">{area.title}</h3>
            <p className="text-sm leading-6 text-slate-300">{area.examples}</p>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-7 md:grid-cols-3">
      {serviceAreas.map((area) => {
        const Icon = area.icon;

        return (
          <article key={area.title} className="min-w-0 px-1 py-2">
            <span className="grid h-9 w-9 place-items-center rounded-md border border-sky-300/20 bg-sky-300/10 text-sky-200">
              <Icon className="h-4 w-4" />
            </span>
            <h3 className="mt-4 text-xl font-semibold tracking-normal text-white">{area.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{area.description}</p>
          </article>
        );
      })}
    </div>
  );
}
