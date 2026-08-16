import { Link } from "@tanstack/react-router";
import { useMemo, useReducer, type MouseEvent, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  Clipboard,
  LockKeyhole,
  RotateCcw,
  Send,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getServiceBySlug } from "@/lib/nova-data";
import {
  classifySupportQuery,
  createSupportSummary,
  createSupportTranscript,
} from "./support-engine";
import { createSupportHandoff, saveSupportHandoff } from "./support-handoff";
import { supportFlows, supportImpactOptions, supportTimingOptions } from "./support-data";
import type {
  SupportDetailOption,
  SupportFlow,
  SupportMatch,
  SupportOption,
} from "./support-types";

type SupportGuideProps = {
  compact?: boolean;
  onNavigate?: () => void;
};

type GuideState = {
  choiceHistory: string[];
  copyState: "idle" | "copied" | "error";
  draft: string;
  flow: SupportFlow | null;
  handoffState: "idle" | "saved" | "error";
  impact?: SupportDetailOption;
  match: SupportMatch | null;
  option?: SupportOption;
  query: string;
  showAllTopics: boolean;
  timing?: SupportDetailOption;
};

type GuideAction =
  | { type: "draft"; value: string }
  | { type: "select-flow"; flow: SupportFlow; query?: string; match?: SupportMatch | null }
  | { type: "select-option"; option: SupportOption }
  | { type: "select-impact"; impact: SupportDetailOption }
  | { type: "select-timing"; timing: SupportDetailOption }
  | { type: "copy-state"; value: GuideState["copyState"] }
  | { type: "handoff-state"; value: GuideState["handoffState"] }
  | { type: "toggle-topics" }
  | { type: "reset" };

const initialState: GuideState = {
  choiceHistory: [],
  copyState: "idle",
  draft: "",
  flow: null,
  handoffState: "idle",
  match: null,
  query: "",
  showAllTopics: false,
};

function guideReducer(state: GuideState, action: GuideAction): GuideState {
  switch (action.type) {
    case "draft":
      return { ...state, draft: action.value };
    case "select-flow":
      return {
        ...state,
        choiceHistory: [],
        copyState: "idle",
        draft: "",
        flow: action.flow,
        handoffState: "idle",
        impact: undefined,
        match: action.match ?? null,
        option: undefined,
        query: action.query ?? "",
        timing: undefined,
      };
    case "select-option":
      return {
        ...state,
        choiceHistory:
          state.option?.id === action.option.id
            ? state.choiceHistory
            : [...state.choiceHistory, `Situation: ${action.option.label}`],
        copyState: "idle",
        handoffState: "idle",
        impact: undefined,
        option: action.option,
        timing: undefined,
      };
    case "select-impact":
      return {
        ...state,
        choiceHistory:
          state.impact?.id === action.impact.id
            ? state.choiceHistory
            : [...state.choiceHistory, `Påverkan: ${action.impact.label}`],
        handoffState: "idle",
        impact: action.impact,
      };
    case "select-timing":
      return {
        ...state,
        choiceHistory:
          state.timing?.id === action.timing.id
            ? state.choiceHistory
            : [...state.choiceHistory, `Tidsbild: ${action.timing.label}`],
        handoffState: "idle",
        timing: action.timing,
      };
    case "copy-state":
      return { ...state, copyState: action.value };
    case "handoff-state":
      return { ...state, handoffState: action.value };
    case "toggle-topics":
      return { ...state, showAllTopics: !state.showAllTopics };
    case "reset":
      return initialState;
  }
}

export function SupportGuide({ compact = false, onNavigate }: SupportGuideProps) {
  const [state, dispatch] = useReducer(guideReducer, initialState);
  const service = getServiceBySlug(state.flow?.serviceSlug);
  const needsClarification = state.match?.requiresClarification === true;
  const urgency =
    state.match?.urgency === "urgent"
      ? "urgent"
      : state.impact?.id === "blocked" || state.impact?.id === "several"
        ? "priority"
        : (state.match?.urgency ?? "standard");
  const summary = useMemo(
    () =>
      state.flow
        ? createSupportSummary({
            flow: state.flow,
            impact: state.impact?.label,
            option: state.option,
            query: state.query,
            timing: state.timing?.label,
            urgency,
          })
        : "",
    [state.flow, state.impact?.label, state.option, state.query, state.timing?.label, urgency],
  );
  const visibleTopics = state.showAllTopics ? supportFlows : supportFlows.slice(0, compact ? 6 : 8);
  const contactReason = state.flow
    ? [state.flow.title, state.option?.label].filter(Boolean).join(" – ")
    : "";
  const contactContext = [state.impact?.label, state.timing?.label].filter(Boolean).join(" · ");
  const contactGuidance = "Beskriv vad som händer, när det började och vad det påverkar.";
  const isComplete = Boolean(state.option && state.impact && state.timing);

  function selectFlow(flow: SupportFlow, query = "", match: SupportMatch | null = null) {
    dispatch({ type: "select-flow", flow, query, match });
  }

  function submitQuestion() {
    const query = state.draft.trim();
    if (!query) return;
    const match = classifySupportQuery(query);
    selectFlow(match.flow, query, match);
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      dispatch({ type: "copy-state", value: "copied" });
      return;
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = summary;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        dispatch({ type: "copy-state", value: copied ? "copied" : "error" });
      } catch {
        dispatch({ type: "copy-state", value: "error" });
      }
    }
  }

  function prepareHandoff(event: MouseEvent<HTMLAnchorElement>) {
    if (!state.flow) return;
    const saved = saveSupportHandoff(
      createSupportHandoff({
        contactReason,
        context: contactContext,
        customerDescription: state.query,
        guidance: contactGuidance,
        transcript: createSupportTranscript({
          flow: state.flow,
          impact: state.impact?.label,
          option: state.option,
          query: state.query,
          timing: state.timing?.label,
          urgency,
        }),
        serviceSlug: state.flow.serviceSlug,
        urgency,
      }),
    );

    if (!saved) {
      event.preventDefault();
      dispatch({ type: "handoff-state", value: "error" });
      return;
    }

    dispatch({ type: "handoff-state", value: "saved" });
    onNavigate?.();
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col",
        compact
          ? "h-full"
          : "mx-auto w-full max-w-4xl rounded-lg border border-white/10 bg-[#0a1118]",
      )}
    >
      {!compact && (
        <div className="border-b border-white/10 px-6 py-6 sm:px-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="eyebrow">Ärendeguide</p>
              <h2 className="mt-2.5 text-2xl font-semibold tracking-[-0.02em] text-white">
                Beskriv problemet en gång. Vi tar det därifrån.
              </h2>
              <p className="mt-2.5 max-w-2xl text-sm leading-6 text-slate-400">
                Guiden sorterar ditt ärende och samlar det Nova IT behöver veta, så att första
                svaret du får redan är konkret.
              </p>
            </div>
            {(state.flow || state.query) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => dispatch({ type: "reset" })}
              >
                <RotateCcw className="h-4 w-4" /> Börja om
              </Button>
            )}
          </div>
        </div>
      )}

      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        className={cn(
          "min-h-0 flex-1 overflow-y-auto",
          compact ? "space-y-3.5 p-4" : "space-y-5 p-6 sm:p-8",
        )}
      >
        {!state.flow && (
          <>
            <Message role="assistant" compact={compact}>
              <p className="leading-6 text-slate-200">
                Berätta vad som krånglar med egna ord, eller välj ett område nedan. Du behöver inte
                veta vad felet beror på.
              </p>
            </Message>

            <Card className="ml-10">
              <CardLabel>Vanliga områden</CardLabel>
              <div className="mt-3.5 grid gap-2 min-[420px]:grid-cols-2">
                {visibleTopics.map((flow) => (
                  <button
                    key={flow.id}
                    type="button"
                    onClick={() => selectFlow(flow)}
                    className="min-h-11 rounded-md border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-left text-sm font-medium text-slate-200 transition-colors hover:border-sky-300/50 hover:bg-sky-300/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  >
                    {flow.label}
                  </button>
                ))}
              </div>
              {supportFlows.length > visibleTopics.length && (
                <TextButton onClick={() => dispatch({ type: "toggle-topics" })}>
                  Visa alla {supportFlows.length} områden
                </TextButton>
              )}
              {state.showAllTopics && (
                <TextButton onClick={() => dispatch({ type: "toggle-topics" })}>
                  Visa färre områden
                </TextButton>
              )}
            </Card>
          </>
        )}

        {(state.query || state.flow) && (
          <Message role="user" compact={compact}>
            {state.query || `Jag behöver hjälp med ${state.flow?.label.toLocaleLowerCase("sv")}.`}
          </Message>
        )}

        {needsClarification && state.match ? (
          <>
            <Message role="assistant" compact={compact}>
              <p className="leading-6 text-slate-200">
                Jag vill inte gissa fel på det här. Vilket ligger närmast?
              </p>
            </Message>
            <Card className="ml-10">
              <div className="grid gap-2">
                {state.match.alternatives.map((flow) => (
                  <button
                    key={flow.id}
                    type="button"
                    onClick={() => selectFlow(flow, state.query)}
                    className="min-h-11 rounded-md border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-left text-sm font-medium text-slate-200 transition-colors hover:border-sky-300/50 hover:bg-sky-300/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  >
                    {flow.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => selectFlow(supportFlows[supportFlows.length - 1], state.query)}
                  className="min-h-11 rounded-md border border-white/10 px-3.5 py-2.5 text-left text-sm font-medium text-slate-400 transition-colors hover:border-white/25 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  Inget av dessa
                </button>
              </div>
            </Card>
          </>
        ) : state.flow ? (
          <>
            <Message role="assistant" compact={compact}>
              <p className="leading-6 text-slate-200">
                Det här hanterar vi som{" "}
                <span className="font-semibold text-white">
                  {state.flow.title.toLocaleLowerCase("sv")}
                </span>
                . {state.flow.intro}
              </p>
            </Message>

            {urgency === "urgent" && (
              <Notice tone="critical" icon={<ShieldAlert className="h-4 w-4" />}>
                <p className="font-semibold">Hör av dig så snart du kan</p>
                <p className="mt-1.5 leading-6 opacity-90">
                  Fortsätt inte klicka, logga in eller göra större ändringar på den berörda enheten
                  under tiden.
                </p>
              </Notice>
            )}

            <Card className="ml-10">
              <CardLabel>Ta fram det här</CardLabel>
              <ol className="mt-3.5 space-y-3">
                {state.flow.firstSteps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm leading-6 text-slate-300">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white/12 text-[11px] font-semibold text-slate-400">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </Card>

            <Card className="ml-10">
              <p className="text-sm font-semibold text-white">{state.flow.question}</p>
              <ChoiceGrid>
                {state.flow.options.map((option) => (
                  <Choice
                    key={option.id}
                    selected={state.option?.id === option.id}
                    onClick={() => dispatch({ type: "select-option", option })}
                  >
                    {option.label}
                  </Choice>
                ))}
              </ChoiceGrid>
            </Card>

            {state.option && (
              <>
                <Message role="user" compact={compact}>
                  {state.option.label}
                </Message>
                <Message role="assistant" compact={compact}>
                  <p className="flex items-start gap-2 leading-6 text-slate-200">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-sky-300" />
                    <span>{state.option.reply}</span>
                  </p>
                </Message>

                <Card className="ml-10">
                  <p className="text-sm font-semibold text-white">Hur stor är påverkan?</p>
                  <ChoiceGrid>
                    {supportImpactOptions.map((impact) => (
                      <Choice
                        key={impact.id}
                        selected={state.impact?.id === impact.id}
                        onClick={() => dispatch({ type: "select-impact", impact })}
                      >
                        {impact.label}
                      </Choice>
                    ))}
                  </ChoiceGrid>

                  <div className="mt-5 border-t border-white/8 pt-5">
                    <p className="text-sm font-semibold text-white">När märktes problemet?</p>
                    <ChoiceGrid>
                      {supportTimingOptions.map((timing) => (
                        <Choice
                          key={timing.id}
                          selected={state.timing?.id === timing.id}
                          onClick={() => dispatch({ type: "select-timing", timing })}
                        >
                          {timing.label}
                        </Choice>
                      ))}
                    </ChoiceGrid>
                  </div>
                </Card>
              </>
            )}

            <Notice tone="caution" icon={<ShieldAlert className="h-4 w-4" />}>
              <p className="font-semibold">När det är läge att höra av sig</p>
              <p className="mt-1.5 leading-6 opacity-90">{state.flow.escalation}</p>
              {service && (
                <p className="mt-2.5 text-sm opacity-75">
                  Det här landar hos: <span className="font-medium">{service.title}</span>
                </p>
              )}
            </Notice>

            <div className="ml-10 rounded-lg border border-sky-300/25 bg-sky-300/[0.06] p-5">
              <p className="font-semibold text-white">
                {isComplete
                  ? "Underlaget är komplett."
                  : "Du kan skicka redan nu – eller svara på frågorna ovan först."}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-slate-300">
                {isComplete
                  ? "Symptom, omfattning och tidsbild följer med ärendet, så vi slipper fråga om grunderna."
                  : "Ju mer som är ifyllt, desto snabbare kan vi svara konkret istället för att ställa motfrågor."}
              </p>

              {state.choiceHistory.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {state.choiceHistory.map((choice, index) => (
                    <li
                      key={`${choice}-${index}`}
                      className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300"
                    >
                      {choice}
                    </li>
                  ))}
                </ul>
              )}

              <details className="group mt-4 rounded-md border border-white/10 bg-[#070e16]">
                <summary className="cursor-pointer list-none px-3.5 py-2.5 text-sm font-medium text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
                  Visa exakt vad som skickas
                </summary>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap border-t border-white/10 p-3.5 font-sans text-xs leading-5 text-slate-400">
                  {summary}
                </pre>
              </details>

              <div className={cn("mt-5 flex gap-2", compact ? "flex-col" : "flex-wrap")}>
                <Button asChild>
                  <Link
                    to="/kontakt"
                    search={{ form: "request", service: state.flow.serviceSlug }}
                    onClick={prepareHandoff}
                  >
                    Fortsätt med underlaget <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button type="button" variant="outline" onClick={copySummary}>
                  <Clipboard className="h-4 w-4" /> Kopiera
                </Button>
                <Button type="button" variant="ghost" onClick={() => dispatch({ type: "reset" })}>
                  <RotateCcw className="h-4 w-4" /> Börja om
                </Button>
              </div>
              <p className="mt-2.5 min-h-5 text-xs text-slate-400" role="status">
                {state.copyState === "copied" && "Sammanfattningen är kopierad."}
                {state.copyState === "error" &&
                  "Kopiering misslyckades. Sammanfattningen visas ovan."}
                {state.handoffState === "error" &&
                  "Underlaget kunde inte sparas i den här webbläsaren. Kopiera det manuellt i stället."}
              </p>
            </div>
          </>
        ) : null}
      </div>

      <form
        className={cn(
          "border-t border-white/10 bg-[#080f17]",
          compact ? "p-4" : "rounded-b-lg px-6 py-5 sm:px-8",
        )}
        onSubmit={(event) => {
          event.preventDefault();
          submitQuestion();
        }}
      >
        <label
          htmlFor={compact ? "nova-question-compact" : "nova-question-page"}
          className="sr-only"
        >
          Beskriv problemet
        </label>
        <div className="flex min-w-0 gap-2">
          <Input
            id={compact ? "nova-question-compact" : "nova-question-page"}
            value={state.draft}
            onChange={(event) => dispatch({ type: "draft", value: event.target.value })}
            placeholder="Till exempel: Wi-Fi bryts under möten"
            maxLength={300}
            autoComplete="off"
            className="min-w-0 border-white/12 bg-[#060d14] text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-300"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Skicka beskrivningen"
            disabled={!state.draft.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2.5 flex items-start gap-2 text-xs leading-5 text-slate-500">
          <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Skriv inte lösenord, personnummer eller bankuppgifter. Inget lämnar din webbläsare förrän
          du väljer att gå vidare till kontakt.
        </p>
      </form>
    </div>
  );
}

/**
 * Ett enda kortutseende genom hela guiden. Tidigare hade varje block sin
 * egen kombination av ram, bakgrund och rundning, vilket fick flödet att
 * se ihopsatt ut. Färg används nu bara där den betyder något - se `Notice`.
 */
function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-white/10 bg-white/[0.022] p-5", className)}>
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
      {children}
    </p>
  );
}

function TextButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3.5 text-xs font-semibold text-sky-300 transition-colors hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
    >
      {children}
    </button>
  );
}

function ChoiceGrid({ children }: { children: ReactNode }) {
  return <div className="mt-3.5 grid gap-2 min-[420px]:grid-cols-2">{children}</div>;
}

function Choice({
  children,
  onClick,
  selected,
}: {
  children: ReactNode;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-md border px-3.5 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
        selected
          ? "border-sky-300 bg-sky-300 font-medium text-slate-950"
          : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-sky-300/50 hover:bg-sky-300/[0.06] hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Färgade block reserveras för två lägen: `critical` (säkerhetsläge som
 * kräver att kunden slutar göra saker) och `caution` (när det är läge att
 * kontakta Nova IT). Allt annat är neutralt, så att rött och gult faktiskt
 * betyder något när det dyker upp.
 */
function Notice({
  children,
  icon,
  tone,
}: {
  children: ReactNode;
  icon: ReactNode;
  tone: "critical" | "caution";
}) {
  return (
    <div
      className={cn(
        "ml-10 rounded-lg border p-5 text-sm",
        tone === "critical"
          ? "border-rose-400/30 bg-rose-400/[0.08] text-rose-50"
          : "border-amber-300/25 bg-amber-300/[0.05] text-amber-50",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

function Message({
  children,
  compact,
  role,
}: {
  children: ReactNode;
  compact: boolean;
  role: "assistant" | "user";
}) {
  const isAssistant = role === "assistant";
  return (
    <div className={cn("flex items-start gap-3", isAssistant ? "justify-start" : "justify-end")}>
      {isAssistant && (
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.04] p-1.5">
          <img src="/nova-it-mark.svg" alt="" aria-hidden="true" className="h-full w-full" />
          <span className="sr-only">Nova IT ärendeguide</span>
        </span>
      )}
      <div
        className={cn(
          "text-sm",
          compact ? "max-w-[calc(100%-2.5rem)]" : "max-w-2xl",
          isAssistant
            ? "pt-1 text-slate-200"
            : "rounded-lg rounded-tr-sm border border-sky-300/20 bg-sky-300/[0.09] px-3.5 py-2.5 text-sky-50",
        )}
      >
        {children}
      </div>
    </div>
  );
}
