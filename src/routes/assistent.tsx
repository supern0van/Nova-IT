import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Send, User, Info } from "lucide-react";
import { assistantSuggestions, getAssistantAnswer } from "@/lib/nova-data";

export const Route = createFileRoute("/assistent")({
  head: () => ({
    meta: [
      { title: "Support-assistent – Nova IT" },
      {
        name: "description",
        content: "Ställ en fråga till Nova IT:s support-assistent och få snabb första hjälp.",
      },
      { property: "og:title", content: "Support-assistent – Nova IT" },
      {
        property: "og:description",
        content: "En första guide när IT strular — inte en ersättare för riktig tekniker.",
      },
    ],
  }),
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; text: string };

function AssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Hej! Beskriv problemet så ger jag ett första förslag. Jag är en enkel demo — för riktig hjälp, boka en tekniker.",
    },
  ]);

  function ask(question: string) {
    if (!question.trim()) return;
    setMessages((m) => [
      ...m,
      { role: "user", text: question },
      { role: "assistant", text: getAssistantAnswer(question) },
    ]);
    setInput("");
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
          <Bot className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Support-assistent</h1>
          <p className="text-sm text-muted-foreground">Snabb första hjälp vid vanliga IT-problem.</p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Det här är en förhandsvisning — svaren är förskrivna och ersätter inte en riktig tekniker.
        </p>
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <div className="max-h-[420px] space-y-4 overflow-y-auto p-5">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
              >
                {m.role === "assistant" && (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </span>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.text}
                </div>
                {m.role === "user" && (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-border/60 p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {assistantSuggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
              className="flex gap-2"
            >
              <label className="sr-only" htmlFor="ask">Din fråga</label>
              <Input
                id="ask"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Beskriv problemet..."
              />
              <Button type="submit" size="icon" aria-label="Skicka">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
