import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ServiceCard } from "@/components/service-card";
import { Container, CTASection } from "@/components/design-system";
import { faqs, processSteps, services } from "@/lib/nova-data";

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
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <section className="relative isolate min-h-[680px] overflow-hidden bg-[#102b2c] text-white sm:min-h-[720px]">
        <img
          src="/nova-it-workspace.png"
          alt="Arbetsplats med dator och nätverksutrustning"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[66%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-[#102b2c]/78" />
        <Container className="flex min-h-[680px] items-end py-14 sm:min-h-[720px] sm:py-18">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
              Datorer · Nätverk · Säkerhet
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-[0.94] tracking-[-0.055em] text-balance sm:text-6xl lg:text-8xl">
              IT som bara fungerar.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200 sm:text-xl">
              När teknik bromsar vardagen tar Nova IT hand om datorer, nätverk, konton och säkerhet.
              Rakt, tryggt och utan onödigt krångel.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-sky-300 text-slate-950 hover:bg-sky-200">
                <Link to="/kontakt" search={{ service: undefined }}>
                  Få hjälp nu <ArrowRight className="h-4 w-4" />
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

      <section className="border-b border-border bg-card">
        <Container className="grid gap-0 md:grid-cols-3">
          {[
            ["Datorer och support", "När en dator, skrivare eller ett program sätter stopp."],
            ["Nätverk som håller", "När Wi-Fi, uppkoppling eller arbetsplatsen behöver fungera."],
            ["Skydd för det viktiga", "När konton, backup eller data behöver hanteras rätt."],
          ].map(([title, text], index) => (
            <article
              key={title}
              className="border-b border-border px-0 py-7 last:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0"
            >
              <span className="text-xs font-semibold text-primary">0{index + 1}</span>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">{title}</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </Container>
      </section>

      <Container className="py-18">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">När tekniken krånglar</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
              Rätt hjälp för problemet du faktiskt har.
            </h2>
          </div>
          <Button asChild variant="ghost" className="w-fit">
            <Link to="/tjanster">
              Alla tjänster <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-5 md:auto-rows-fr md:grid-cols-3">
          {services.slice(0, 3).map((service) => (
            <ServiceCard key={service.slug} service={service} compact />
          ))}
        </div>
      </Container>

      <section className="border-y border-sky-100 bg-[#eef7fb] text-foreground">
        <Container className="grid gap-10 py-16 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Så arbetar vi
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
              Mindre gissningar. Mer kontroll.
            </h2>
            <p className="mt-4 max-w-md leading-7 text-muted-foreground">
              Ett tydligt ärende ger rätt hjälp snabbare och minskar risken att problemet växer.
            </p>
          </div>
          <ol className="grid gap-7 sm:grid-cols-3">
            {processSteps.map((step, index) => (
              <li key={step.title}>
                <span className="text-xs font-semibold text-primary">0{index + 1}</span>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <Container className="grid gap-10 py-18 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
        <div>
          <p className="eyebrow">Vanliga frågor</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
            Kort om hur Nova IT hjälper.
          </h2>
          <p className="mt-4 max-w-md leading-7 text-muted-foreground">
            Hittar du inte det du söker? Beskriv vad som händer, så hjälper Nova IT dig vidare.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/faq">Se frågor och svar</Link>
          </Button>
        </div>
        <Accordion type="single" collapsible>
          {faqs.slice(0, 4).map((faq) => (
            <AccordionItem key={faq.q} value={faq.q}>
              <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
              <AccordionContent className="leading-6 text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>

      <CTASection
        title="Tekniken ska hjälpa dig framåt. Inte stå i vägen."
        text="Beskriv vad som händer så hittar Nova IT rätt väg framåt."
        secondaryTo="/arbetssatt"
        secondaryLabel="Så arbetar vi"
      />
    </>
  );
}
