import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { services, serviceCategories } from "@/lib/nova-data";
import { ServiceCard } from "@/components/service-card";
import { Container, CTASection, PageHeader } from "@/components/design-system";

export const Route = createFileRoute("/tjanster")({
  head: () => ({
    meta: [
      { title: "Tjänster – Nova IT" },
      {
        name: "description",
        content:
          "Praktisk tjänstekatalog för IT-support, nätverk, datorinstallation, felsökning, säkerhet, backup och molnkontor.",
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const choiceSignals = [
    {
      title: "Välj support",
      text: "När något stoppar arbetsdagen just nu: konto, skrivare, program eller dator.",
    },
    {
      title: "Välj felsökning",
      text: "När felet återkommer, är oklart eller behöver testas metodiskt.",
    },
    {
      title: "Välj säkerhet",
      text: "När det handlar om kontoangrepp, backup, åtkomst eller risk för dataförlust.",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Tjänstekatalog"
        title="IT-hjälp uppdelad efter verkliga problem."
        intro="Välj den kategori som ligger närmast det som stoppar arbetet. Varje område visar vanliga ärenden, förväntat resultat och ett förvalt kontaktflöde."
      />

      <Container className="py-14">
        <div className="grid gap-4 md:grid-cols-2">
          {serviceCategories.map((category, index) => (
            <article key={category.title} className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary">0{index + 1}</span>
                <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                  {category.serviceSlugs.length} tjänster
                </span>
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">{category.title}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">{category.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {category.serviceSlugs.map((slug) => {
                  const service = services.find((item) => item.slug === slug);
                  if (!service) return null;
                  return (
                    <Link
                      key={service.slug}
                      to="/kontakt"
                      search={{ service: service.slug }}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/35 hover:bg-primary/5 hover:text-primary"
                    >
                      {service.shortTitle}
                    </Link>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </Container>

      <section className="border-y border-border bg-card">
        <Container className="grid gap-8 py-14 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="eyebrow">Snabbval</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-balance">
              Osäker på var ärendet hör hemma?
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Börja med effekten av problemet. Det går snabbare än att gissa teknisk orsak.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {choiceSignals.map((signal) => (
              <article
                key={signal.title}
                className="rounded-lg border border-border bg-secondary/35 p-5"
              >
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h3 className="mt-4 font-semibold">{signal.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{signal.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-border bg-secondary/35">
        <Container className="py-16">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Alla tjänsteområden</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">
                Sex vägar till ett tydligare nästa steg.
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/assistent">
                Osäker? Öppna Nova-guiden <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        </Container>
      </section>

      <CTASection
        title="Osäker på vilket område som passar?"
        text="Börja i Nova-guiden eller välj närmaste tjänst. Valet går att ändra i kontaktformuläret."
      />
    </>
  );
}
