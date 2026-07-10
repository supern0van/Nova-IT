import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Clipboard, Info, RotateCcw, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getServiceBySlug } from "@/lib/nova-data";
import { createSupportSummary, matchSupportFlow } from "./support-engine";
import { supportFlows } from "./support-data";
import type { SupportFlow, SupportOption } from "./support-types";
import { RobotMascot } from "./RobotMascot";

type SupportGuideProps = {
  compact?: boolean;
  onNavigate?: () => void;
};

export function SupportGuide({ compact = false, onNavigate }: SupportGuideProps) {
  const [flow, setFlow] = useState<SupportFlow | null>(null);
  const [option, setOption] = useState<SupportOption | undefined>();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const service = getServiceBySlug(flow?.serviceSlug);
  const summary = useMemo(
    () => (flow ? createSupportSummary({ flow, option, query: submittedQuery }) : ""),
    [flow, option, submittedQuery],
  );

  function selectFlow(nextFlow: SupportFlow, nextQuery = "") {
    setFlow(nextFlow);
    setOption(undefined);
    setSubmittedQuery(nextQuery);
    setCopyState("idle");
  }

  function reset() {
    setFlow(null);
    setOption(undefined);
    setQuery("");
    setSubmittedQuery("");
    setCopyState("idle");
  }

  async function copySummary() {
    try {
      await Promise.race([
        navigator.clipboard.writeText(summary),
        new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error("Clipboard timeout")), 800),
        ),
      ]);
      setCopyState("copied");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = summary;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      setCopyState(copied ? "copied" : "error");
    }
  }

  return (
    <div
      className={cn("min-w-0", compact ? "space-y-4" : "grid gap-7 lg:grid-cols-[0.72fr_1.28fr]")}
    >
      <aside
        className={cn(
          "min-w-0 rounded-lg border border-border bg-card",
          compact ? "p-3" : "p-5 lg:sticky lg:top-28",
        )}
      >
        {!compact && (
          <div className="mb-5 flex items-center gap-3">
            <RobotMascot />
            <div>
              <h2 className="font-semibold">Välj ett område</h2>
              <p className="text-sm text-muted-foreground">13 förskrivna felsökningsspår</p>
            </div>
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = query.trim();
            if (!trimmed) return;
            selectFlow(matchSupportFlow(trimmed), trimmed);
            setQuery("");
          }}
        >
          <label
            htmlFor={compact ? "bot-question" : "guide-question"}
            className="text-sm font-semibold"
          >
            Beskriv problemet
          </label>
          <div className="mt-2 flex min-w-0 gap-2">
            <Input
              id={compact ? "bot-question" : "guide-question"}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                compact ? "Exempel: skrivaren är offline" : "Exempel: Wi-Fi tappar anslutningen"
              }
              className="min-w-0"
            />
            <Button type="submit" size="icon" aria-label="Sortera problemet">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </form>

        <div className={cn("mt-4", compact ? "max-h-40 overflow-y-auto pr-1" : "grid gap-2")}>
          <div
            className={cn(
              compact ? "grid grid-cols-2 gap-2" : "grid gap-2 sm:grid-cols-2 lg:grid-cols-1",
            )}
          >
            {supportFlows.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={flow?.id === item.id}
                onClick={() => selectFlow(item)}
                className={cn(
                  "rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  flow?.id === item.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/35 hover:bg-primary/5",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {!compact && (
          <div className="mt-5 flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="leading-6">Guiden gör inga AI-anrop och skickar inga uppgifter.</p>
          </div>
        )}
      </aside>

      <section className="min-w-0" aria-live="polite">
        {!flow ? (
          <div
            className={cn(
              "rounded-lg border border-dashed border-primary/35 bg-primary/5 text-center",
              compact ? "p-6" : "p-10",
            )}
          >
            <RobotMascot className="mx-auto h-14 w-14" />
            <h2 className="mt-4 text-xl font-semibold">Vad behöver sorteras?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Välj ett område eller beskriv problemet. Guiden visar säkra första kontroller och när
              det är klokt att gå vidare.
            </p>
          </div>
        ) : (
          <article className="overflow-hidden rounded-lg border border-border bg-card operational-shadow">
            <div className="bg-[#102724] px-5 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                    Regelbaserat spår
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">{flow.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-md p-2 text-emerald-100 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Börja om"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-sm leading-6 text-emerald-50/80">{flow.intro}</p>
            </div>

            <div className={cn("grid gap-px bg-border", compact ? "" : "md:grid-cols-2")}>
              <div className="bg-card p-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Kontrollera först
                </h3>
                <ol className="mt-3 space-y-3">
                  {flow.firstSteps.map((step, index) => (
                    <li key={step} className="flex gap-3 text-sm leading-6">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/8 text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-card p-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {flow.question}
                </h3>
                <div className="mt-3 grid gap-2">
                  {flow.options.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={option?.id === item.id}
                      onClick={() => {
                        setOption(item);
                        setCopyState("idle");
                      }}
                      className={cn(
                        "rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        option?.id === item.id
                          ? "border-primary bg-primary/8 font-medium text-primary"
                          : "border-border hover:border-primary/35",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {option && (
              <div className="border-t border-border bg-secondary/45 p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Check className="h-4 w-4" /> Nästa rimliga kontroll
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{option.reply}</p>
              </div>
            )}

            <div className="border-t border-border p-5">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <ShieldAlert className="h-4 w-4 text-amber-600" /> När support behövs
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{flow.escalation}</p>
              {service && (
                <p className="mt-3 text-sm font-medium text-primary">
                  Föreslagen tjänst: {service.title}
                </p>
              )}

              <div className={cn("mt-5 flex gap-2", compact ? "flex-col" : "flex-wrap")}>
                <Button asChild onClick={onNavigate}>
                  <Link to="/kontakt" search={{ service: flow.serviceSlug }}>
                    Fortsätt till formulär <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button type="button" variant="outline" onClick={copySummary}>
                  <Clipboard className="h-4 w-4" /> Kopiera sammanfattning
                </Button>
              </div>
              <p className="mt-2 min-h-5 text-xs text-muted-foreground" role="status">
                {copyState === "copied" && "Sammanfattningen är kopierad."}
                {copyState === "error" &&
                  "Kopiering misslyckades. Markera texten manuellt i stället."}
              </p>
            </div>
          </article>
        )}
      </section>
    </div>
  );
}
