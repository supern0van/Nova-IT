import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, CircleDashed, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, CTASection, DemoNotice, PageHeader } from "@/components/design-system";

export const Route = createFileRoute("/case-study")({
  head: () => ({
    meta: [
      { title: "Case study – från AI-prototyp till tydligare IT-demo" },
      {
        name: "description",
        content:
          "En ärlig dokumentation av hur Nova IT utvecklas från Lovable-prototyp till en mer genomarbetad och testad frontend.",
      },
    ],
  }),
  component: CaseStudyPage,
});

const stages = [
  {
    number: "01",
    label: "Lovable-prototyp",
    status: "Genomförd",
    text: "En komplett första form togs fram snabbt: startsida, tjänster, FAQ, kontakt och en enkel assistent.",
    result: "Bra bredd, men generisk form och flera påhittade bolagsuppgifter.",
  },
  {
    number: "02",
    label: "Codex pass 1",
    status: "Genomförd",
    text: "Språk, formulär, tillgänglighet, tjänsteförval och demo-säkerhet förbättrades i den befintliga kodbasen.",
    result: "Stabilare och ärligare, men fortfarande visuellt försiktig.",
  },
  {
    number: "03",
    label: "Visuell redesign",
    status: "Genomförd",
    text: "Ett tydligare designsystem, operativa statusytor och starkare sidstruktur gör förbättringen synlig även utan kodgranskning.",
    result: "Mer egen identitet och bättre väg från problem till nästa steg.",
  },
  {
    number: "04",
    label: "Professionell demo",
    status: "Genomförd",
    text: "Supportbot, återanvändbar supportmotor och bredare interaktion testas i samma designsystem.",
    result: "En sammanhängande frontend som går att demonstrera och utvärdera.",
  },
  {
    number: "05",
    label: "Möjlig verklig version",
    status: "Inte beslutad",
    text: "Bolagsuppgifter, databehandling, backend, tillgänglighetsgranskning och publiceringsansvar kräver riktiga beslut.",
    result: "Inget av detta låtsas vara färdigt i demon.",
  },
];

function CaseStudyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Case study"
        title="Från AI-prototyp till tydligare IT-demo."
        intro="Projektet dokumenterar både fart och friktion: vad generativa verktyg gav snabbt, vad som behövde granskas och vilka mänskliga beslut som gjorde resultatet mer användbart."
        aside={<DemoNotice className="mt-5" />}
      />

      <Container className="grid gap-10 py-16 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="eyebrow">Varför dokumentera processen?</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-balance">
            Resultatet är bara halva projektet.
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Utvecklingsstegen gör det möjligt att skilja snabb generering från faktiskt
            förbättringsarbete. Här visas vad som ändrades, varför det ändrades och vad som ännu
            saknas.
          </p>
          <blockquote className="mt-7 border-l-2 border-primary pl-5 text-lg font-medium leading-8">
            Verktygen gav fart, men kvaliteten kom från granskning, prioritering och tydligare
            beslut.
          </blockquote>
        </div>

        <ol className="space-y-4">
          {stages.map((stage, index) => (
            <li
              key={stage.number}
              className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-[auto_1fr] sm:p-6"
            >
              <div
                className={`grid h-11 w-11 place-items-center rounded-md text-xs font-semibold ${
                  index < 4
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-secondary text-muted-foreground"
                }`}
              >
                {stage.number}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-semibold tracking-[-0.02em]">{stage.label}</h3>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {stage.status}
                  </span>
                </div>
                <p className="mt-3 leading-7 text-muted-foreground">{stage.text}</p>
                <p className="mt-3 flex items-start gap-2 text-sm font-medium">
                  {index < 4 ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  {stage.result}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Container>

      <section className="border-y border-border bg-secondary/40">
        <Container className="py-16">
          <div className="flex items-center gap-3">
            <GitCompareArrows className="h-5 w-5 text-primary" />
            <p className="eyebrow">Kommande jämförelser</p>
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">
            Platser för verifierade före- och efterbilder.
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <ComparisonPlaceholder
              label="Före"
              text="Lovable/Codex pass 1 – arkiverad referensbild läggs in när jämförelsen är verifierad."
            />
            <ComparisonPlaceholder
              label="Efter"
              text="Visuell redesign – samma viewport och innehåll används för en rättvis jämförelse."
            />
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            Inga skärmbilder eller mätvärden uppfinns. Jämförelser läggs bara till när båda
            versionerna har fångats under samma villkor.
          </p>
        </Container>
      </section>

      <Container className="grid gap-8 py-16 lg:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="eyebrow">Vad redesignen gör bättre</p>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
            <li>• Tydligare visuell hierarki och mer egen identitet.</li>
            <li>• Operativa statusytor i stället för dekorativa mallsektioner.</li>
            <li>• Samma väg från tjänst och guide till förvalt kontaktformulär.</li>
            <li>• Projektets demo-status syns utan att dominera varje budskap.</li>
          </ul>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="eyebrow">Vad som saknas före verklig lansering</p>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
            <li>• Beslut om verkligt bolag, målgrupp och erbjudande.</li>
            <li>• Juridik, personuppgiftshantering och riktig kontaktkanal.</li>
            <li>• Backend, drift, övervakning och incidentrutiner.</li>
            <li>• Oberoende tillgänglighets- och säkerhetsgranskning.</li>
          </ul>
        </article>
      </Container>

      <CTASection
        title="Se tjänsterna—eller följ utvecklingen vidare."
        text="Case study-sidan är projektets levande dokumentation och uppdateras först när nästa steg är verifierat."
        secondaryTo="/tjanster"
        secondaryLabel="Se tjänstekatalogen"
      />
    </>
  );
}

function ComparisonPlaceholder({ label, text }: { label: string; text: string }) {
  return (
    <div className="tech-grid grid min-h-64 place-items-center rounded-lg border border-dashed border-primary/30 bg-background p-8 text-center">
      <div>
        <span className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {label}
        </span>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted-foreground">{text}</p>
        <Button asChild variant="ghost" size="sm" className="mt-4">
          <Link to="/case-study">
            Dokumenterad plats <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
