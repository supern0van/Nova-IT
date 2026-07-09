import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  credibilityItems,
  demoNotice,
  faqs,
  processSteps,
  serviceCategories,
  services,
} from "@/lib/nova-data";
import { ServiceCard } from "@/components/service-card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nova IT – fiktiv svensk IT-supportdemo" },
      {
        name: "description",
        content:
          "En polerad svensk demo för Nova IT med tydliga IT-tjänster, supportguide och tillgängligt kontaktformulär.",
      },
      { property: "og:title", content: "Nova IT – svensk IT-supportdemo" },
      {
        property: "og:description",
        content:
          "Fiktiv client-ready webbplats för IT-support, nätverk, säkerhet och bokningsflöden.",
      },
    ],
  }),
  component: Home,
});

const heroStats = [
  { value: "Fiktivt", label: "demo-case, tydligt märkt" },
  { value: "6", label: "konkreta tjänsteområden" },
  { value: "0", label: "riktiga kund- eller org-claims" },
];

const credibilityIcons = [ShieldCheck, ClipboardList, LockKeyhole];

function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#eef6f4_48%,#f6f7fb_100%)]">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-medium text-emerald-900 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Demo-säker svensk IT-webb
            </span>
            <h1 className="mt-6 text-5xl font-semibold leading-none sm:text-6xl">Nova IT</h1>
            <p className="mt-5 max-w-2xl text-xl text-muted-foreground">
              IT-stöd för små verksamheter som vill slippa vardagsstrul, otydliga besked och
              låtsastrygghet.
            </p>
            <p className="mt-4 max-w-2xl text-muted-foreground">{demoNotice}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/kontakt">
                  Beskriv ditt ärende
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/tjanster">Se tjänster</Link>
              </Button>
            </div>

            <dl className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-md border border-white/70 bg-white/70 p-4 shadow-sm"
                >
                  <dt className="text-2xl font-semibold">{stat.value}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -right-5 top-8 hidden rounded-md border border-sky-200 bg-white/90 px-4 py-3 text-sm shadow-lg lg:block">
              <p className="font-medium">Supportguide</p>
              <p className="text-muted-foreground">Förskrivna svar, inga AI-anrop</p>
            </div>
            <div className="overflow-hidden rounded-lg border border-white/80 bg-white shadow-xl">
              <img
                src="/nova-it-workspace.png"
                alt="Ljust kontor med laptop, headset och nätverksutrustning."
                className="aspect-[4/3] h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 left-5 right-5 rounded-md border border-emerald-200 bg-white p-4 shadow-lg">
              <p className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Fokus på tydliga åtgärder före stora löften.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <p className="text-sm font-medium uppercase text-muted-foreground">
              Tydligare tjänsteområden
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Välj väg utifrån problemet, inte tekniken bakom.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Den förbättrade strukturen gör det lättare att förstå vad Nova IT kan hjälpa till med
              och vilket formulärval som passar.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {serviceCategories.map((category) => (
              <div key={category.title} className="rounded-lg border border-border/70 bg-card p-5">
                <h3 className="text-lg font-semibold">{category.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {category.serviceSlugs.map((slug) => {
                    const service = services.find((item) => item.slug === slug);
                    if (!service) return null;

                    return (
                      <li key={slug} className="flex items-center justify-between gap-3">
                        <span>{service.shortTitle}</span>
                        <Link
                          to="/kontakt"
                          search={{ service: service.slug }}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Välj
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-14 md:grid-cols-3">
          {credibilityItems.map((item, index) => {
            const Icon = credibilityIcons[index] ?? MessageSquare;

            return (
              <Card key={item.title} className="border-border/70 bg-background/80">
                <CardContent className="p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase text-muted-foreground">
              Populära ärendetyper
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Tjänster som går att förstå direkt
            </h2>
          </div>
          <Button asChild variant="ghost">
            <Link to="/tjanster">
              Alla tjänster
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 3).map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-lg border border-primary/15 bg-primary px-6 py-10 text-primary-foreground md:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">
                Från otydligt problem till tydligt nästa steg.
              </h2>
              <p className="mt-3 text-primary-foreground/80">
                Kontaktformuläret samlar brådska, tjänst och beskrivning så en verklig tekniker
                skulle kunna prioritera rätt.
              </p>
            </div>
            <ol className="grid gap-3 md:grid-cols-3">
              {processSteps.map((step, index) => (
                <li key={step.title} className="rounded-md bg-white/10 p-4">
                  <span className="text-sm text-primary-foreground/70">0{index + 1}</span>
                  <h3 className="mt-2 font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-primary-foreground/75">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[0.75fr_1fr]">
        <div>
          <p className="text-sm font-medium uppercase text-muted-foreground">FAQ</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Frågor som gör demon ärlig</h2>
          <p className="mt-3 text-muted-foreground">
            Inga dolda fejkclaims. Vanliga frågor förklarar vad som är demo och vad som hade behövt
            lösas i en skarp version.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/faq">Se alla frågor</Link>
          </Button>
        </div>
        <Accordion type="single" collapsible>
          {faqs.slice(0, 4).map((faq) => (
            <AccordionItem key={faq.q} value={faq.q}>
              <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </>
  );
}
