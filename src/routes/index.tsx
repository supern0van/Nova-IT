import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/design-system";
import { ServiceAreas } from "@/components/service-areas";
import { processSteps } from "@/lib/nova-data";

const homeUrl = "https://nova-it.se/";
const socialImageUrl = "https://nova-it.se/nova-it-workspace.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nova IT – IT som bara fungerar" },
      {
        name: "description",
        content: "Praktisk IT-support för datorer, nätverk, konton och säkerhet.",
      },
      { property: "og:title", content: "Nova IT – IT som bara fungerar" },
      {
        property: "og:description",
        content: "Praktisk hjälp när datorer, nätverk eller konton bromsar vardagen.",
      },
      { property: "og:url", content: homeUrl },
      { property: "og:image", content: socialImageUrl },
      { name: "twitter:image", content: socialImageUrl },
    ],
    links: [{ rel: "canonical", href: homeUrl }],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <section className="relative isolate min-h-[690px] overflow-hidden bg-[#090f15] text-white sm:min-h-[760px]">
        <img
          src="/nova-it-workspace.png"
          alt="Arbetsplats med dator och nätverksutrustning"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[62%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-[#090f15]/76" />
        <Container className="flex min-h-[690px] items-end py-14 sm:min-h-[760px] sm:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
              Praktisk IT-hjälp
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-[0.94] tracking-normal text-balance sm:text-6xl lg:text-8xl">
              IT som bara fungerar.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
              Hjälp med datorer, nätverk, konton och program när tekniken bromsar vardagen. Tydligt,
              personligt och utan onödigt krångel.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-sky-400 text-slate-950 hover:bg-sky-300">
                <Link to="/kontakt" search={{ form: "request", service: undefined }}>
                  Beskriv ärende <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Link to="/tjanster">Se tjänster</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="nova-section">
        <Container className="py-16 sm:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
                Det vi hjälper till med
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal text-balance sm:text-4xl">
                Rätt hjälp för problemet du faktiskt har.
              </h2>
            </div>
            <Link
              to="/tjanster"
              className="text-sm font-medium text-sky-300 transition-colors hover:text-sky-200"
            >
              Se alla tjänster
            </Link>
          </div>
          <div className="pt-8">
            <ServiceAreas compact />
          </div>
        </Container>
      </section>

      <section className="nova-section">
        <Container className="grid gap-10 py-18 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
              Så arbetar vi
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-balance sm:text-4xl">
              Mindre gissningar. Mer kontroll.
            </h2>
            <p className="mt-4 max-w-md leading-7 text-muted-foreground">
              Du ska inte behöva kunna den tekniska orsaken för att komma vidare.
            </p>
          </div>
          <ol className="grid gap-7 sm:grid-cols-3">
            {processSteps.map((step) => (
              <li key={step.title} className="border-t border-slate-700 pt-4">
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{step.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </>
  );
}
