import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
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
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { credibilityItems, faqs, processSteps, serviceCategories, services } from "@/lib/nova-data";
import { ServiceCard } from "@/components/service-card";
import { Container, CTASection, TrustNotice, StatusPanel } from "@/components/design-system";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nova IT – IT-support, nätverk och säkerhet" },
      {
        name: "description",
        content:
          "Svensk IT-support för datorproblem, Wi-Fi, installationer, säkerhet, backup och konton.",
      },
      { property: "og:title", content: "Nova IT – IT-support, nätverk och säkerhet" },
      {
        property: "og:description",
        content: "Från otydligt IT-problem till ett begripligt nästa steg.",
      },
    ],
  }),
  component: Home,
});

const credibilityIcons = [ShieldCheck, ClipboardList, LockKeyhole];

function Home() {
  return (
    <>
      <section className="tech-grid relative overflow-hidden border-b border-border bg-secondary/35">
        <Container className="grid gap-12 py-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-20">
          <div>
            <p className="eyebrow">Svensk IT-support · nätverk · säkerhet</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl">
              IT-hjälp som börjar med att reda ut läget.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Nova IT hjälper dig ringa in problemet, prioritera rätt och få hjälp med datorer,
              nätverk, installationer, konton och säkerhet.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/kontakt" search={{ service: undefined }}>
                  Beskriv ärende <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-background/70">
                <Link to="/assistent">Starta Nova-guiden</Link>
              </Button>
            </div>

            <p className="mt-4 text-xs font-medium text-muted-foreground">
              Beskriv problemet så återkommer Nova IT med rätt nästa steg.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -left-5 top-8 hidden h-20 w-px bg-primary/25 lg:block" />
            <StatusPanel />
          </div>
        </Container>
      </section>

      <section className="border-b border-border bg-card">
        <Container className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
          {["Problem först", "Tydlig prioritet", "Rätt tjänst", "Nästa steg"].map((item, index) => (
            <div
              key={item}
              className="flex items-center gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:border-r sm:[&:nth-child(2)]:border-r-0 lg:border-b-0 lg:[&:nth-child(2)]:border-r lg:last:border-r-0"
            >
              <span className="text-xs font-semibold text-primary">0{index + 1}</span>
              <span className="text-sm font-medium">{item}</span>
            </div>
          ))}
        </Container>
      </section>

      <Container className="py-18">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow">Tjänstekarta</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
              Välj efter vad som stoppar arbetet.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Två tydliga ingångar samlar vardagssupport och mer långsiktiga driftfrågor.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/tjanster">Se hela tjänstekatalogen</Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {serviceCategories.map((category, index) => (
              <article key={category.title} className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">0{index + 1}</span>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                    {category.serviceSlugs.length} områden
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em]">{category.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {category.description}
                </p>
                <ul className="mt-6 divide-y divide-border border-y border-border">
                  {category.serviceSlugs.map((slug) => {
                    const service = services.find((item) => item.slug === slug);
                    if (!service) return null;

                    return (
                      <li key={slug}>
                        <Link
                          to="/kontakt"
                          search={{ service: service.slug }}
                          className="flex items-center justify-between py-3 text-sm font-medium transition-colors hover:text-primary"
                        >
                          {service.shortTitle}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </Container>

      <section className="border-y border-border bg-secondary/45">
        <Container className="py-16">
          <div className="grid gap-5 md:grid-cols-3">
            {credibilityItems.map((item, index) => {
              const Icon = credibilityIcons[index] ?? MessageSquareText;
              return (
                <article
                  key={item.title}
                  className="rounded-lg border border-border bg-background p-6"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/8 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      <Container className="py-18">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Vanliga ärenden</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              Tjänster med ett tydligt resultat.
            </h2>
          </div>
          <Button asChild variant="ghost">
            <Link to="/tjanster">
              Alla sex områden <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {services.slice(0, 3).map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </Container>

      <section className="border-y border-border bg-[#102724] text-white">
        <Container className="grid gap-10 py-16 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="eyebrow text-emerald-200">Arbetssätt</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-balance">
              Från symptom till dokumenterat nästa steg.
            </h2>
            <p className="mt-4 leading-7 text-slate-300">
              Ett bra supportflöde börjar med rätt information, inte med stora löften.
            </p>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 md:grid-cols-3">
            {processSteps.map((step, index) => (
              <li key={step.title} className="bg-[#102724] p-6">
                <span className="text-xs font-semibold text-emerald-300">0{index + 1}</span>
                <h3 className="mt-5 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{step.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <Container className="grid gap-10 py-18 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="eyebrow">Nova-guiden</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
            Sortera problemet innan du beskriver det.
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Guiden hjälper dig skilja på nätverk, dator, konto och backup. Den ger inte en full
            lösning, utan förbereder ett tydligt ärende till Nova IT.
          </p>
          <Button asChild className="mt-6">
            <Link to="/assistent">
              Starta Nova-guiden <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 operational-shadow">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Exempel: långsam dator
          </p>
          <div className="mt-5 space-y-3">
            {[
              "När märks problemet mest?",
              "Gäller det ett program eller hela datorn?",
              "Hur påverkar det arbete, studier eller vardag?",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-md bg-secondary/60 p-3 text-sm"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </Container>

      <section className="border-y border-border bg-card">
        <Container className="grid gap-8 py-14 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div>
            <p className="eyebrow">Innan du bokar</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-balance">
              Tre saker gör supportärendet lättare att lösa.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Den bästa hjälpen börjar med rätt symptom, rätt omfattning och ett tydligt mål.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Omfattning", "Gäller det en person, en dator eller flera enheter?"],
              ["Tidpunkt", "När började det och är problemet återkommande?"],
              ["Konsekvens", "Stoppar det arbete, möten, inloggning eller filer?"],
            ].map(([title, text]) => (
              <article key={title} className="rounded-lg border border-border bg-secondary/35 p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-border bg-card">
        <Container className="grid gap-10 py-16 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">
              Vanliga frågor innan du bokar.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Här hittar du korta svar om tjänster, distanssupport, säkerhet och hur ärenden brukar
              förberedas.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/faq">Se alla frågor</Link>
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
      </section>

      <Container className="pt-16">
        <TrustNotice />
      </Container>
      <CTASection
        title="Beskriv vad som stoppar arbetet—så blir nästa steg lättare att välja."
        text="Formuläret hjälper dig samla tjänst, brådska och ärendebeskrivning så Nova IT kan bedöma nästa steg."
      />
    </>
  );
}
