import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, HeartHandshake, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, CTASection, TrustNotice, PageHeader } from "@/components/design-system";

export const Route = createFileRoute("/om-oss")({
  head: () => ({
    meta: [
      { title: "Om Nova IT – praktisk IT-support" },
      {
        name: "description",
        content:
          "Nova IT hjälper privatpersoner och mindre verksamheter med datorer, nätverk, installationer, säkerhet och backup.",
      },
    ],
  }),
  component: About,
});

const principles = [
  {
    icon: Building2,
    title: "Praktisk hjälp",
    text: "Fokus ligger på konkreta datorproblem, nätverk, konton, installationer och vardaglig IT som behöver fungera.",
  },
  {
    icon: ShieldCheck,
    title: "Tydligt ansvar",
    text: "Ärenden sorteras innan åtgärd så att rätt supportnivå, risk och brådska kan bedömas.",
  },
  {
    icon: HeartHandshake,
    title: "Personlig support",
    text: "Tydlig hjälp som utgår från hur problemet påverkar dig, din arbetsdag och din verksamhet.",
  },
];

function About() {
  return (
    <>
      <PageHeader
        eyebrow="Om Nova IT"
        title="Rätt hjälp när tekniken bromsar."
        intro="Nova IT hjälper privatpersoner och mindre verksamheter med datorer, nätverk, konton och säkerhet."
        aside={<TrustNotice className="mt-5" />}
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
            <p className="eyebrow">Arbetssätt</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
              Från oklart problem till planerad åtgärd.
            </h2>
          </div>
          <Button asChild variant="outline" className="bg-background">
            <Link to="/arbetssatt">
              Se arbetssätt <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>

      <CTASection
        title="Beskriv problemet så tar Nova IT nästa steg."
        text="Ju tydligare ärendet är från början, desto lättare blir det att välja fjärrsupport, service eller besök."
        secondaryTo="/arbetssatt"
        secondaryLabel="Se arbetssätt"
      />
    </>
  );
}
