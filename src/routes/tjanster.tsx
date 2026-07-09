import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { services, serviceCategories } from "@/lib/nova-data";
import { ServiceCard } from "@/components/service-card";

export const Route = createFileRoute("/tjanster")({
  head: () => ({
    meta: [
      { title: "Tjänster – Nova IT" },
      {
        name: "description",
        content:
          "Tydliga demo-tjänster för IT-support, nätverk, datorinstallation, felsökning, säkerhet, backup och molnkontor.",
      },
      { property: "og:title", content: "Tjänster – Nova IT" },
      {
        property: "og:description",
        content: "Se hur en svensk IT-supportsajt kan presentera tjänster utan fejkade kundlöften.",
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <>
      <section className="border-b border-border/70 bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <Layers3 className="h-3.5 w-3.5" />
              Tjänstekarta
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              IT-hjälp uppdelad efter verkliga problem
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Nova IT är fiktivt, men strukturen är byggd för en skarp svensk supportsajt: tydliga
            kategorier, konkreta exempel och inga påhittade kundsiffror.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-2">
          {serviceCategories.map((category) => (
            <div key={category.title} className="rounded-lg border border-border/70 bg-card p-6">
              <h2 className="text-xl font-semibold">{category.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {category.serviceSlugs.map((slug) => {
                  const service = services.find((item) => item.slug === slug);
                  if (!service) return null;

                  return (
                    <Link
                      key={service.slug}
                      to="/kontakt"
                      search={{ service: service.slug }}
                      className="rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {service.shortTitle}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 md:flex md:items-center md:justify-between md:gap-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Osäker på vilken tjänst som passar?
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Använd supportguiden för en första sortering eller beskriv ärendet direkt i
              formuläret.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 md:mt-0">
            <Button asChild>
              <Link to="/kontakt">
                Beskriv ärende
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/assistent">Öppna supportguide</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
