import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle2, CircleHelp, Info, Search, ShieldAlert } from "lucide-react";
import {
  assistantQuickActions,
  getAssistantAnswer,
  getServiceBySlug,
  type AssistantAnswer,
} from "@/lib/nova-data";
import { Container, CTASection, DemoNotice, PageHeader } from "@/components/design-system";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assistent")({
  head: () => ({
    meta: [
      { title: "Frågeguiden – Nova IT" },
      {
        name: "description",
        content:
          "Regelbaserad frontendguide för att sortera vanliga IT-problem och välja rätt tjänsteområde.",
      },
    ],
  }),
  component: GuidePage,
});

const introAnswer: AssistantAnswer = {
  title: "Välj vad som ligger närmast problemet",
  summary:
    "Guiden använder förskrivna svar för att sortera ärendet. Den gör ingen riktig felsökning och skickar inga uppgifter.",
  steps: [
    "Välj en kategori eller skriv en kort beskrivning.",
    "Kontrollera de första stegen utan att göra riskfyllda ändringar.",
    "Gå vidare med rätt tjänst när problemet behöver en tekniker.",
  ],
  escalation:
    "Vid driftstopp, säkerhetsfrågor eller problem som påverkar flera personer bör ärendet lämnas över direkt.",
  serviceSlug: "it-support",
};

function GuidePage() {
  const [input, setInput] = useState("");
  const [question, setQuestion] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [answer, setAnswer] = useState<AssistantAnswer>(introAnswer);

  function ask(value: string, label?: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setQuestion(trimmed);
    setSelectedLabel(label ?? null);
    setAnswer(getAssistantAnswer(trimmed));
    setInput("");
  }

  return (
    <>
      <PageHeader
        eyebrow="Frågeguiden"
        title="Sortera problemet innan du beskriver ärendet."
        intro="En regelbaserad frontendguide med förskrivna svar. Den hjälper dig välja rimliga första kontroller och rätt tjänstekategori—utan AI, API eller diagnostik."
        aside={<DemoNotice className="mt-5" />}
      />

      <Container className="grid gap-8 py-14 lg:grid-cols-[0.62fr_1.38fr] lg:items-start">
        <aside className="rounded-lg border border-border bg-card p-5 lg:sticky lg:top-28">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/8 text-primary">
              <CircleHelp className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold">Välj ett område</h2>
              <p className="text-sm text-muted-foreground">Fem vanliga ingångar</p>
            </div>
          </div>

          <div className="mt-5 grid gap-2">
            {assistantQuickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                aria-pressed={selectedLabel === action.label}
                onClick={() => ask(action.prompt, action.label)}
                className={cn(
                  "flex items-center justify-between rounded-md border px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selectedLabel === action.label
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/35 hover:bg-primary/5",
                )}
              >
                {action.label}
                <ArrowRight className="h-4 w-4" />
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="leading-6">
                Undvik att starta om utrustning eller ändra konton om det riskerar data, pågående
                arbete eller säkerhet.
              </p>
            </div>
          </div>
        </aside>

        <div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask(input);
            }}
            className="rounded-lg border border-border bg-card p-4"
          >
            <label htmlFor="guide-question" className="text-sm font-semibold">
              Beskriv problemet med egna ord
            </label>
            <div className="mt-3 flex gap-2">
              <Input
                id="guide-question"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Exempel: Wi-Fi tappar anslutningen i mötesrummet"
              />
              <Button type="submit" aria-label="Sortera problemet">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Sortera</span>
              </Button>
            </div>
          </form>

          {question && (
            <div className="mt-4 flex items-start gap-3 rounded-md bg-secondary/55 p-4 text-sm">
              <span className="font-semibold text-primary">Din beskrivning</span>
              <span className="text-muted-foreground">{question}</span>
            </div>
          )}

          <div aria-live="polite" className="mt-5">
            <AnswerPanel answer={answer} />
          </div>
        </div>
      </Container>

      <CTASection
        title="Guiden ringar in problemet. Formuläret samlar resten."
        text="Vald tjänst följer med till kontaktflödet, men inga uppgifter skickas vidare i demon."
        secondaryTo="/tjanster"
        secondaryLabel="Jämför tjänster"
      />
    </>
  );
}

function AnswerPanel({ answer }: { answer: AssistantAnswer }) {
  const service = getServiceBySlug(answer.serviceSlug);

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card operational-shadow">
      <div className="border-b border-border bg-[#102724] px-5 py-5 text-white sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
          Förslag från den regelbaserade guiden
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{answer.title}</h2>
      </div>

      <div className="grid gap-px bg-border md:grid-cols-2">
        <div className="bg-card p-5 sm:p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Möjlig orsak
          </h3>
          <p className="mt-3 leading-7 text-muted-foreground">{answer.summary}</p>
        </div>
        <div className="bg-card p-5 sm:p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Kontrollera först
          </h3>
          <ol className="mt-3 space-y-3">
            {answer.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-6">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/8 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="grid gap-5 border-t border-border p-5 sm:p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="h-4 w-4 text-amber-600" /> När support behövs
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{answer.escalation}</p>
          {service && (
            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4" /> Föreslagen tjänst: {service.title}
            </p>
          )}
        </div>
        <Button asChild>
          <Link to="/kontakt" search={{ service: answer.serviceSlug }}>
            Fortsätt till formulär <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
