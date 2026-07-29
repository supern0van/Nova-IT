import { Link } from "@tanstack/react-router";
import { useMemo, useReducer, type MouseEvent, type ReactNode } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  Clipboard,
  Info,
  LockKeyhole,
  RotateCcw,
  Search,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getServiceBySlug } from "@/lib/nova-data";
import { classifySupportQuery, createSupportSummary } from "./support-engine";
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
          : "mx-auto w-full max-w-5xl rounded-xl border border-white/10 bg-[#0a1118]",
      )}
    >
      {!compact && (
        <div className="border-b border-white/10 px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
                Förbered ditt ärende
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Beskriv problemet med rätt underlag.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Beskriv vad du märker. Guiden hjälper dig att välja rätt ärendetyp och samla det
                Nova IT behöver för att kunna hjälpa dig vidare.
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
        className={cn("min-h-0 flex-1 space-y-4 overflow-y-auto", compact ? "p-4" : "p-5 sm:p-7")}
      >
        <Message role="assistant" compact={compact}>
          <p className="font-semibold text-white">Automatisk ärendeguide</p>
          <p className="mt-1 leading-5 text-slate-400">
            Jag hjälper dig välja kontaktorsak och samla ett tydligare underlag till Nova IT.
          </p>
        </Message>

        {!state.flow && (
          <div className="ml-9 rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Vanliga områden
            </p>
            <div className="mt-3 grid gap-2 min-[420px]:grid-cols-2">
              {visibleTopics.map((flow) => (
                <button
                  key={flow.id}
                  type="button"
                  onClick={() => selectFlow(flow)}
                  className="min-h-11 rounded-md border border-slate-700 bg-[#0b131c] px-3 py-2.5 text-left text-sm font-medium text-slate-200 transition-colors hover:border-sky-300/55 hover:bg-sky-300/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  {flow.label}
                </button>
              ))}
            </div>
            {supportFlows.length > visibleTopics.length && (
              <button
                type="button"
                onClick={() => dispatch({ type: "toggle-topics" })}
                className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-sky-300 hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                Visa alla områden
              </button>
            )}
            {state.showAllTopics && (
              <button
                type="button"
                onClick={() => dispatch({ type: "toggle-topics" })}
                className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-sky-300 hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                Visa färre områden
              </button>
            )}
          </div>
        )}

        {(state.query || state.flow) && (
          <Message role="user" compact={compact}>
            {state.query || `Jag behöver hjälp med ${state.flow?.label.toLocaleLowerCase("sv")}.`}
          </Message>
        )}

        {needsClarification && state.match ? (
          <Message role="assistant" compact={compact}>
            <p className="font-semibold text-white">Jag vill inte gissa fel.</p>
            <p className="mt-1 leading-6 text-slate-300">
              Vilket av områdena ligger närmast det du menar?
            </p>
            <div className="mt-3 grid gap-2">
              {state.match.alternatives.map((flow) => (
                <button
                  key={flow.id}
                  type="button"
                  onClick={() => selectFlow(flow, state.query)}
                  className="min-h-11 rounded-md border border-slate-600 px-3 py-2 text-left text-sm font-medium text-slate-100 hover:border-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  {flow.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => selectFlow(supportFlows[supportFlows.length - 1], state.query)}
                className="min-h-11 rounded-md border border-slate-600 px-3 py-2 text-left text-sm font-medium text-slate-100 hover:border-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                Något annat
              </button>
            </div>
          </Message>
        ) : state.flow ? (
          <>
            <Message role="assistant" compact={compact}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-white">
                  Det här passar bäst som {state.flow.title.toLocaleLowerCase("sv")}.
                </p>
                {state.match && (
                  <span className="shrink-0 rounded-full bg-sky-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-200">
                    Trolig matchning
                  </span>
                )}
              </div>
              <p className="mt-2 leading-6 text-slate-300">{state.flow.intro}</p>
              <p className="mt-3 text-xs leading-5 text-slate-400">
                Guiden ger inga reparationssteg. Nova IT gör den tekniska bedömningen.
              </p>
              <Link
                to="/kontakt"
                search={{ form: "request", service: state.flow.serviceSlug }}
                onClick={prepareHandoff}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-200 underline decoration-sky-300/35 underline-offset-4 hover:text-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                Skicka ärendet med det vi har <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Message>

            {state.match?.urgency === "urgent" && (
              <div className="ml-9 rounded-lg border border-rose-300/30 bg-rose-300/10 p-4 text-rose-50">
                <p className="flex items-center gap-2 font-semibold">
                  <ShieldAlert className="h-4 w-4" /> Kontakta support så snart som möjligt
                </p>
                <p className="mt-2 text-sm leading-6 text-rose-100/85">
                  Fortsätt inte klicka, logga in eller göra större ändringar på den berörda enheten.
                </p>
              </div>
            )}

            <div className="ml-9 overflow-hidden rounded-lg border border-white/10 bg-white/[0.035]">
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Börja med att samla detta
                </p>
                <ol className="mt-3 space-y-3">
                  {state.flow.firstSteps.map((step, index) => (
                    <li key={step} className="flex gap-3 text-sm leading-6 text-slate-200">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-300/10 text-xs font-semibold text-sky-200">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="border-t border-white/10 p-4">
                <p className="text-sm font-semibold text-white">{state.flow.question}</p>
                <div className="mt-3 grid gap-2 min-[420px]:grid-cols-2">
                  {state.flow.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={state.option?.id === option.id}
                      onClick={() => dispatch({ type: "select-option", option })}
                      className={cn(
                        "min-h-11 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
                        state.option?.id === option.id
                          ? "border-sky-300 bg-sky-300 text-slate-950"
                          : "border-slate-700 text-slate-200 hover:border-sky-300/60",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {state.option && (
              <>
                <Message role="user" compact={compact}>
                  {state.option.label}
                </Message>
                <Message role="assistant" compact={compact}>
                  <p className="flex items-center gap-2 font-semibold text-white">
                    <Check className="h-4 w-4 text-sky-300" /> Bra, då vet vi mer.
                  </p>
                  <p className="mt-2 leading-6 text-slate-300">{state.option.reply}</p>
                </Message>
                <div className="ml-9 overflow-hidden rounded-lg border border-white/10 bg-white/[0.035]">
                  <div className="p-4">
                    <p className="text-sm font-semibold text-white">Hur stor är påverkan?</p>
                    <div className="mt-3 grid gap-2 min-[420px]:grid-cols-2">
                      {supportImpactOptions.map((impact) => (
                        <button
                          key={impact.id}
                          type="button"
                          aria-pressed={state.impact?.id === impact.id}
                          onClick={() => dispatch({ type: "select-impact", impact })}
                          className={cn(
                            "min-h-11 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
                            state.impact?.id === impact.id
                              ? "border-sky-300 bg-sky-300 text-slate-950"
                              : "border-slate-700 text-slate-200 hover:border-sky-300/60",
                          )}
                        >
                          {impact.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-white/10 p-4">
                    <p className="text-sm font-semibold text-white">När märktes problemet?</p>
                    <div className="mt-3 grid gap-2 min-[420px]:grid-cols-2">
                      {supportTimingOptions.map((timing) => (
                        <button
                          key={timing.id}
                          type="button"
                          aria-pressed={state.timing?.id === timing.id}
                          onClick={() => dispatch({ type: "select-timing", timing })}
                          className={cn(
                            "min-h-11 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
                            state.timing?.id === timing.id
                              ? "border-sky-300 bg-sky-300 text-slate-950"
                              : "border-slate-700 text-slate-200 hover:border-sky-300/60",
                          )}
                        >
                          {timing.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {state.impact && state.timing && (
                  <Message role="assistant" compact={compact}>
                    <p className="font-semibold text-white">Tack, nu är ärendet tydligare.</p>
                    <p className="mt-1 leading-6 text-slate-300">
                      Nova IT får både symptom, omfattning och tidsbild i sammanfattningen.
                    </p>
                  </Message>
                )}
              </>
            )}

            {state.choiceHistory.length > 0 && (
              <div className="ml-9 rounded-md border border-white/10 bg-[#081018]/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Dina val i ordning
                </p>
                <ol className="mt-2 space-y-1.5 text-xs leading-5 text-slate-400">
                  {state.choiceHistory.map((choice, index) => (
                    <li key={`${choice}-${index}`} className="flex gap-2">
                      <span className="text-slate-400">{index + 1}.</span>
                      <span>{choice}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="ml-9 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                <ShieldAlert className="h-4 w-4" /> När du bör gå vidare
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{state.flow.escalation}</p>
              {service && (
                <p className="mt-3 text-sm font-medium text-sky-200">Förslag: {service.title}</p>
              )}
            </div>

            <div className="ml-9 rounded-lg border border-sky-300/25 bg-sky-300/[0.07] p-4">
              <p className="font-semibold text-white">
                {state.option && state.impact && state.timing
                  ? "Ditt underlag är tydligt och redo för Nova IT."
                  : "Underlaget kan redan skickas till Nova IT."}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Kontrollera vad som följer med innan du öppnar kontaktformuläret.
              </p>
              <details className="mt-3 rounded-md border border-white/10 bg-[#081018]">
                <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
                  Visa sammanfattningen
                </summary>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap border-t border-white/10 p-3 font-sans text-xs leading-5 text-slate-300">
                  {summary}
                </pre>
              </details>
              <div className={cn("mt-4 flex gap-2", compact ? "flex-col" : "flex-wrap")}>
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
              <p className="mt-2 min-h-5 text-xs text-slate-400" role="status">
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
          "border-t border-white/10 bg-[#0a1118]",
          compact ? "p-4" : "rounded-b-xl px-5 py-4 sm:px-7",
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
            placeholder="Beskriv vad som krånglar…"
            maxLength={300}
            autoComplete="off"
            className="min-w-0 border-slate-700 bg-[#071018] text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-300"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Skicka frågan"
            disabled={!state.draft.trim()}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-400">
          <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Skriv inte lösenord, personnummer eller bankuppgifter. Undvik uppgifter om andra om de
          inte behövs. Inget skickas förrän du väljer kontakt.
        </p>
      </form>
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
    <div className={cn("flex items-start gap-2.5", isAssistant ? "justify-start" : "justify-end")}>
      {isAssistant && (
        <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md border border-sky-300/25 bg-sky-300/10 text-sky-200">
          <Bot className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Automatisk guide</span>
        </span>
      )}
      <div
        className={cn(
          "text-sm",
          compact ? "max-w-[calc(100%-2.25rem)]" : "max-w-2xl",
          isAssistant
            ? "py-1 text-slate-200"
            : "rounded-md border border-sky-300/25 bg-sky-300/10 px-3 py-2.5 text-sky-50",
        )}
      >
        {children}
      </div>
      {!isAssistant && (
        <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-700 text-slate-200">
          <UserRound className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Du</span>
        </span>
      )}
    </div>
  );
}
