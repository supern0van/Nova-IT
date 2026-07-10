import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, HeartHandshake, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, CTASection, DemoNotice, PageHeader } from "@/components/design-system";

export const Route = createFileRoute("/om-oss")({
  head: () => ({
    meta: [
      { title: "Om Nova IT – fiktivt demo-case" },
      {
        name: "description",
        content:
          "Nova IT är ett fiktivt svenskt IT-supportdemo med tydliga avgränsningar, ärlig copy och dokumenterad utvecklingsprocess.",
      },
    ],
  }),
  component: About,
});

const principles = [
  {
    icon: Building2,
    title: "Fiktivt bolag",
    text: "Ingen adress, inget organisationsnummer och inga kundsiffror som kan misstas för verkliga.",
  },
  {
    icon: ShieldCheck,
    title: "Säkra avgränsningar",
    text: "Tjänster och formulär visar ett möjligt arbetssätt utan att lova verklig drift eller databehandling.",
  },
  {
    icon: HeartHandshake,
    title: "Praktisk svensk ton",
    text: "Rak och begriplig text för mindre verksamheter, skolor och privatpersoner.",
  },
];

function About() {
  return (
    <>
      <PageHeader
        eyebrow="Om Nova IT"
        title="Ett fiktivt supportbolag med verklighetstrogen struktur."
        intro="Nova IT är byggt för att visa hur en snabb AI-prototyp kan granskas, förbättras och dokumenteras utan att låtsas vara ett etablerat företag."
        aside={<DemoNotice className="mt-5" />}
      />

      <Container className="py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {principles.map((item, index) => (
            <article key={item.title} className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/8 text-primary">
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-muted-foreground">0{index + 1}</span>
              </div>
              <h2 className="mt-5 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 grid gap-8 rounded-lg border border-border bg-secondary/40 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="eyebrow">Dokumenterad process</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
              Se vad Lovable gav, vad Codex förbättrade och vad som återstår.
            </h2>
          </div>
          <Button asChild variant="outline" className="bg-background">
            <Link to="/case-study">
              Öppna case study <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>

      <CTASection
        title="Demon är en grund för beslut—inte ett påstående om ett färdigt företag."
        text="Nästa nivå handlar om testad interaktion och en gemensam supportmotor, fortfarande utan att låtsas ha riktig drift."
        secondaryTo="/case-study"
        secondaryLabel="Följ utvecklingsstegen"
      />
    </>
  );
}
