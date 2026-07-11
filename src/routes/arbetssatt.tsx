import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ClipboardList, MonitorCog, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, CTASection, PageHeader, TrustNotice } from "@/components/design-system";

export const Route = createFileRoute("/arbetssatt")({
  head: () => ({
    meta: [
      { title: "Arbetssätt – Nova IT" },
      {
        name: "description",
        content:
          "Så arbetar Nova IT från första ärendebeskrivning till felsökning, åtgärd och uppföljning.",
      },
    ],
  }),
  component: WorkMethodPage,
});

const stages = [
  {
    icon: ClipboardList,
    title: "1. Ring in ärendet",
    text: "Nova IT börjar med att förstå vad som inte fungerar, vem som påverkas och hur brådskande det är.",
  },
  {
    icon: ShieldCheck,
    title: "2. Bedöm risk och väg",
    text: "Konton, filer, backup och säkerhet prioriteras försiktigt så att felsökning inte gör problemet större.",
  },
  {
    icon: MonitorCog,
    title: "3. Åtgärda eller planera",
    text: "Ärendet styrs mot fjärrsupport, service, installation, nätverksgenomgång eller vidare planering.",
  },
];

const outcomes = [
  "Tydligare ärendebeskrivning innan supporten startar.",
  "Mindre tid på gissningar och fel väg in.",
  "Bättre underlag när hårdvara, konto eller nätverk behöver kontrolleras.",
  "Enklare beslut om ärendet passar distans, besök eller inlämning.",
];

function WorkMethodPage() {
  return (
    <>
      <PageHeader
        eyebrow="Arbetssätt"
        title="IT-support börjar med rätt fråga, inte med snabba chansningar."
        intro="Nova IT hjälper dig sortera problemet innan åtgärd. Det sparar tid, minskar risk och gör det lättare att välja rätt supportform."
        aside={<TrustNotice className="mt-5" />}
      />

      <Container className="grid gap-10 py-16 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="eyebrow">Så går det till</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-balance">
            Ett lugnt flöde från symptom till nästa steg.
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Målet är att göra det enkelt att be om hjälp utan att du behöver veta teknisk orsak i
            förväg.
          </p>
          <Button asChild className="mt-7">
            <Link to="/kontakt" search={{ service: undefined }}>
              Beskriv ärende <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4">
          {stages.map((stage) => (
            <article key={stage.title} className="rounded-lg border border-border bg-card p-6">
              <div className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary/8 text-primary">
                  <stage.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.02em]">{stage.title}</h3>
                  <p className="mt-2 leading-7 text-muted-foreground">{stage.text}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>

      <section className="border-y border-border bg-secondary/40">
        <Container className="py-16">
          <p className="eyebrow">Vad du får</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">
            Hjälp som är tydlig redan innan felsökningen börjar.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {outcomes.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-border bg-card p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm leading-6 text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CTASection
        title="Vet du inte vilken tjänst som passar? Börja med ärendet."
        text="Nova IT kan hjälpa dig avgöra om problemet hör till dator, nätverk, konto, installation, säkerhet eller backup."
        secondaryTo="/tjanster"
        secondaryLabel="Se tjänster"
      />
    </>
  );
}
