import { useCallback, useEffect, useRef, useState, useReducer } from "react";
import { classifySupportQuery } from "./support-engine";
import { hamtaRelevantaDokument, type KnowledgeDoc } from "./support-knowledge";
import { chattaMedAi } from "./support-chat-server";
import { MAX_TURNS, type ChatMessage } from "./support-chat";
import type { SupportServiceSlug, SupportUrgency } from "./support-types";

/**
 * Klientsidans chatt-state. Historiken hålls i React-state och skickas i
 * sin helhet med varje anrop (stateless server, se `support-chat-server.ts`
 * huvudkommentar för varför) - inget sparas mellan sidladdningar, precis
 * som den gamla guidens sessionStorage-baserade handoff hade en TTL, inte
 * en persistent historik.
 */

export type DisplayMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citedDocs?: KnowledgeDoc[];
  quickReplies?: string[];
};

type PendingAssistant = {
  content: string;
  citedDocs: KnowledgeDoc[];
  quickReplies: string[];
  serviceSlug: SupportServiceSlug | null;
  urgency: SupportUrgency;
  securityIncident: boolean;
};

type ChatState = {
  messages: DisplayMessage[];
  draft: string;
  status: "idle" | "loading" | "ai-unavailable" | "session-limit";
  serviceSlug: SupportServiceSlug | null;
  urgency: SupportUrgency;
  securityIncident: boolean;
};

type ChatAction =
  | { type: "draft"; value: string }
  | { type: "user-message"; content: string }
  | { type: "assistant-message"; pending: PendingAssistant }
  | { type: "status"; value: ChatState["status"] }
  | { type: "local-security-flag" }
  | { type: "reset" };

const initialState: ChatState = {
  messages: [],
  draft: "",
  status: "idle",
  serviceSlug: null,
  urgency: "standard",
  securityIncident: false,
};

function reducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "draft":
      return { ...state, draft: action.value };
    case "user-message":
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: crypto.randomUUID(), role: "user", content: action.content },
        ],
        draft: "",
        status: "loading",
      };
    case "assistant-message":
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: action.pending.content,
            citedDocs: action.pending.citedDocs,
            quickReplies: action.pending.quickReplies,
          },
        ],
        status: "idle",
        serviceSlug: action.pending.serviceSlug ?? state.serviceSlug,
        urgency: action.pending.urgency,
        securityIncident: state.securityIncident || action.pending.securityIncident,
      };
    case "status":
      return { ...state, status: action.value };
    case "local-security-flag":
      return { ...state, securityIncident: true, urgency: "urgent" };
    case "reset":
      return initialState;
  }
}

/**
 * Ord-för-ord-uppspelning av ett redan färdigt svar - "strömmande känsla"
 * utan att behöva lösa riktig SSE-routning genom TanStack Starts
 * serverfunktioner (se docs/changes för avvägningen - en genomtänkt
 * avvägning, inte en genväg som glömdes bort). Respekterar
 * `prefers-reduced-motion` genom att hoppa direkt till hela texten.
 *
 * Returnerar den text som just nu ska visas - avsiktligt EXPONERAD som
 * state (inte en intern ref), annars finns det inget sätt för UI:t att
 * faktiskt rita upp den stegvisa uppspelningen.
 */
function useStreamedReveal(fullText: string | null, onDone: () => void) {
  const [revealed, setRevealed] = useState("");
  const onDoneRef = useRef(onDone);

  // Uppdaterar referensen EFTER render, aldrig under den - `step()` nedan
  // läser alltid den senaste `onDone` via referensen utan att behöva
  // trigga om huvudeffekten (som bara ska starta om när `fullText` faktiskt
  // ändras, inte varje gång anropande komponent råkar återrendera).
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (fullText === null) {
      // Body för själva bytet läggs i en timeout i stället för att köras
      // synkront i effekten - undviker en kaskaderande render mitt i
      // effektfasen.
      const timer = setTimeout(() => setRevealed(""), 0);
      return () => clearTimeout(timer);
    }

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      const timer = setTimeout(() => {
        setRevealed(fullText);
        onDoneRef.current();
      }, 0);
      return () => clearTimeout(timer);
    }

    const words = fullText.split(" ");
    let index = 0;
    let timer: ReturnType<typeof setTimeout>;

    function step() {
      index += 1;
      setRevealed(words.slice(0, index).join(" "));
      if (index >= words.length) {
        onDoneRef.current();
        return;
      }
      timer = setTimeout(step, 28);
    }
    timer = setTimeout(step, 0);

    return () => clearTimeout(timer);
  }, [fullText]);

  return revealed;
}

export function useSupportChat() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const turerRef = useRef(0);
  const [pending, setPending] = useState<PendingAssistant | null>(null);

  const revealedText = useStreamedReveal(pending?.content ?? null, () => {
    setPending((current) => {
      if (current) dispatch({ type: "assistant-message", pending: current });
      return null;
    });
  });

  function submit(text?: string) {
    const query = (text ?? state.draft).trim();
    if (!query || state.status === "loading" || pending) return;
    if (turerRef.current >= MAX_TURNS) {
      dispatch({ type: "status", value: "session-limit" });
      return;
    }

    // Lokal, ögonblicklig säkerhetskoll - oavsett om AI:n svarar eller ens
    // är nåbar. Samma nyckelordsspår som `support-chat-server.ts` använder
    // server-side, körs här också client-side så att varningen aldrig är
    // beroende av ett lyckat nätverksanrop.
    if (classifySupportQuery(query).urgency === "urgent") {
      dispatch({ type: "local-security-flag" });
    }

    const historik: ChatMessage[] = [
      ...state.messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: query },
    ];
    const turNummer = turerRef.current;
    turerRef.current += 1;
    dispatch({ type: "user-message", content: query });

    chattaMedAi({ data: { meddelanden: historik, sessionsTurer: turNummer } })
      .then((resultat) => {
        if (!resultat.ok) {
          if (resultat.anledning === "for-manga-turer") {
            dispatch({ type: "status", value: "session-limit" });
          } else if (historik.length === 1) {
            // Första turen misslyckades - AI:n är sannolikt av eller nere.
            // Fallande tillbaka till den regelbaserade guiden är UI-lagrets
            // ansvar (se SupportChat.tsx), inte hookens.
            dispatch({ type: "status", value: "ai-unavailable" });
          } else {
            dispatch({ type: "status", value: "idle" });
          }
          return;
        }

        const docIds = new Set(resultat.svar.citedDocIds);
        const citedDocs = docIds.size
          ? hamtaRelevantaDokument(query).filter((_, i) => docIds.has(i + 1))
          : [];

        setPending({
          content: resultat.svar.reply,
          citedDocs,
          quickReplies: resultat.svar.quickReplies,
          serviceSlug: resultat.svar.serviceSlug,
          urgency: resultat.svar.urgency,
          securityIncident: resultat.svar.securityIncident,
        });
      })
      .catch(() => {
        dispatch({ type: "status", value: historik.length === 1 ? "ai-unavailable" : "idle" });
      });
  }

  const setDraft = useCallback((value: string) => dispatch({ type: "draft", value }), []);
  const reset = useCallback(() => {
    turerRef.current = 0;
    setPending(null);
    dispatch({ type: "reset" });
  }, []);

  return {
    messages: state.messages,
    draft: state.draft,
    setDraft,
    submit,
    status: pending ? "streaming" : state.status,
    streamingText: pending ? revealedText : null,
    serviceSlug: state.serviceSlug,
    urgency: state.urgency,
    securityIncident: state.securityIncident,
    reset,
    isFirstTurn: state.messages.length === 0,
  } as const;
}
