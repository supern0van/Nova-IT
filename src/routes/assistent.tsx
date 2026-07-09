import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Bot, Info, Send, User } from "lucide-react";
import { assistantQuickActions, getAssistantAnswer, type AssistantAnswer } from "@/lib/nova-data";

export const Route = createFileRoute("/assistent")({
  head: () => ({
    meta: [
      { title: "Supportguide – Nova IT" },
      {
        name: "description",
        content:
          "Supportguide för Nova IT med fördefinierade svar och tydlig väg vidare till kontaktformuläret.",
      },
      { property: "og:title", content: "Supportguide – Nova IT" },
      {
        property: "og:description",
        content: "En guidad demo för vanliga IT-problem. Inga AI-anrop och ingen backend.",
      },
    ],
  }),
  component: AssistantPage,
});

type Message = { role: "user"; text: string } | { role: "assistant"; answer: AssistantAnswer };

const introAnswer: AssistantAnswer = {
  title: "Guiden hjälper dig att sortera ärendet",
  summary:
    "Det här är en demo med fördefinierade svar. Välj en kategori eller beskriv problemet så får du ett första strukturerat förslag.",
  steps: [
    "Välj en snabbkategori för vanliga ärenden.",
    "Läs vilka kontroller som är rimliga att göra först.",
    "Gå vidare till formuläret när ärendet behöver en tekniker.",
  ],
  escalation:
    "Vid driftstopp, säkerhetsfrågor eller problem som påverkar flera personer bör ärendet alltid lämnas över till support.",
  serviceSlug: "it-support",
};

function AssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", answer: introAnswer }]);

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { role: "user", text: trimmed },
      { role: "assistant", answer: getAssistantAnswer(trimmed) },
    ]);
    setInput("");
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
        <div>
          <span className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary">
            <Bot className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Supportguide</h1>
          <p className="mt-3 text-muted-foreground">
            En tydlig guidad demo för vanliga IT-problem. Den utger sig inte för att vara en riktig
            AI och gör inga anrop utanför webbläsaren.
          </p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Demo, inte diagnostik</p>
              <p className="mt-1">
                Svaren är fördefinierade och ska hjälpa besökaren att formulera ett bättre ärende.
                För riktig hjälp går flödet vidare till formuläret.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="mt-8 border-border/70 shadow-sm">
        <CardContent className="p-0">
          <div className="border-b border-border/60 p-4">
            <p className="text-sm font-medium">Snabbkategorier</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {assistantQuickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => ask(action.prompt)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[520px] space-y-5 overflow-y-auto p-5">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
              >
                {message.role === "assistant" && (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </span>
                )}

                {message.role === "user" ? (
                  <div className="max-w-[80%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
                    {message.text}
                  </div>
                ) : (
                  <AssistantAnswerCard answer={message.answer} />
                )}

                {message.role === "user" && (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-border/60 p-4">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                ask(input);
              }}
              className="flex gap-2"
            >
              <label className="sr-only" htmlFor="ask">
                Beskriv problemet
              </label>
              <Input
                id="ask"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Exempel: Datorn är långsam efter uppdatering..."
              />
              <Button type="submit" size="icon" aria-label="Skicka fråga">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function AssistantAnswerCard({ answer }: { answer: AssistantAnswer }) {
  return (
    <div className="max-w-[86%] rounded-lg bg-muted px-4 py-3 text-sm text-foreground">
      <h2 className="text-base font-semibold">{answer.title}</h2>
      <p className="mt-2 text-muted-foreground">{answer.summary}</p>
      <ol className="mt-3 space-y-2">
        {answer.steps.map((step, index) => (
          <li key={step} className="flex gap-2">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-background text-xs font-medium text-muted-foreground">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 rounded-md border border-border bg-background p-3 text-muted-foreground">
        {answer.escalation}
      </p>
      <Button asChild size="sm" className="mt-3">
        <Link to="/kontakt" search={{ service: answer.serviceSlug }}>
          Fortsätt till formulär
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
