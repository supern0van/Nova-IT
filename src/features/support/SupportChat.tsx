import { useEffect, useId, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SupportGuide } from "./SupportGuide";
import { createSupportHandoff, saveSupportHandoff } from "./support-handoff";
import { useSupportChat } from "./support-chat-hook";
import { MessageBubble } from "./chat/MessageBubble";
import { QuickReplyChips } from "./chat/QuickReplyChips";
import { TypingIndicator } from "./chat/TypingIndicator";
import { SafetyNotice } from "./chat/SafetyNotice";
import { ChatComposer } from "./chat/ChatComposer";

type SupportChatProps = {
  compact?: boolean;
  onNavigate?: () => void;
};

/**
 * Den fria supportchatten - ersätter den gamla regelbaserade
 * guiden (`SupportGuide.tsx`) som primär upplevelse.
 *
 * VIKTIGT: `SupportGuide.tsx` tas INTE bort. Om AI:n är avstängd, budgeten
 * är slut eller det första anropet misslyckas av något skäl, faller den här
 * komponenten tillbaka till den gamla regelbaserade guiden i stället för en
 * död ände - se `docs/changes` för resonemanget. Guiden ska fungera exakt
 * som förut oavsett vad som händer med AI-tjänsten.
 *
 * Layout (ren UI/UX-omarbetning, ingen ändring av AI-logik/serverlogik):
 * panelen är tre fasta delar - bara konversationsytan (1) scrollar. "Aktuella
 * val" (2) och inmatningen (3) ligger stilla längst ned, direkt intill
 * varandra, och visar bara den SENASTE turens val i stället för att bygga
 * upp en lång lista av gamla alternativ i historiken.
 */
export function SupportChat({ compact = false, onNavigate }: SupportChatProps) {
  const chat = useSupportChat();
  const logRef = useRef<HTMLDivElement>(null);
  const wasNearBottomRef = useRef(true);
  const inputId = useId();

  // Autoscroll bara om användaren redan var nära botten - stör inte någon
  // som aktivt scrollat upp för att läsa tidigare meddelanden.
  useEffect(() => {
    const el = logRef.current;
    if (!el || !wasNearBottomRef.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chat.messages.length, chat.streamingText]);

  if (chat.status === "ai-unavailable") {
    return <SupportGuide compact={compact} onNavigate={onNavigate} />;
  }

  const isBusy = chat.status === "loading" || chat.status === "streaming";
  const lastMessage = chat.messages.at(-1);
  // Bara den senaste turens val visas - inga gamla, ihopbyggda alternativ.
  const currentQuickReplies =
    !isBusy && lastMessage?.role === "assistant" ? (lastMessage.quickReplies ?? []) : [];

  function prepareHandoff() {
    const firstUser = chat.messages.find((m) => m.role === "user")?.content ?? "";
    const lastUser = [...chat.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const transcript = chat.messages
      .map((m) => `${m.role === "user" ? "Kund" : "Guide"}: ${m.content}`)
      .join("\n");

    saveSupportHandoff(
      createSupportHandoff({
        contactReason: lastUser || "Kontakt via ärendeguidens chatt",
        context: "",
        customerDescription: firstUser,
        guidance: "Beskriv gärna vad som händer om du hinner - vi har redan konversationen ovan.",
        transcript,
        // Ett okänt tjänsteområde landar hos allmän IT-support hellre än att
        // navigeringen misslyckas - samma princip som den gamla guidens
        // sista reservflöde.
        serviceSlug: chat.serviceSlug ?? "it-support",
        urgency: chat.urgency,
      }),
    );
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
        <div className="border-b border-white/10 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="eyebrow">Ärendeguide</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">
                Fråga vad som helst. Vi svarar direkt.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Chatta fritt om vad som krånglar. Guiden svarar utifrån Nova IT:s faktiska tjänster
                och underlag - den felsöker inte och ersätter inte en tekniker.
              </p>
            </div>
            {chat.messages.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={chat.reset}>
                <RotateCcw className="h-4 w-4" /> Börja om
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 1. Konversationsyta - det ENDA som scrollar. */}
      <div
        ref={logRef}
        onScroll={(event) => {
          const el = event.currentTarget;
          wasNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
        }}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        className={cn(
          "min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent",
          compact ? "space-y-3 p-4" : "space-y-4 p-6 sm:p-8",
        )}
      >
        {chat.messages.length === 0 && (
          <MessageBubble
            role="assistant"
            compact={compact}
            content="Hej! Berätta vad som krånglar, eller ställ en fråga om våra tjänster - jag svarar direkt och hjälper dig vidare till rätt person om det behövs."
          />
        )}

        {chat.messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role}
            content={message.content}
            compact={compact}
            citedDocs={message.citedDocs}
          />
        ))}

        {chat.status === "streaming" && chat.streamingText !== null && (
          <MessageBubble
            role="assistant"
            compact={compact}
            content={chat.streamingText}
            isStreaming
          />
        )}

        {chat.status === "loading" && <TypingIndicator />}

        {chat.securityIncident && <SafetyNotice />}

        {chat.status === "session-limit" && (
          <div className="ml-10 rounded-md bg-amber-300/[0.06] px-3.5 py-2.5 text-sm text-amber-100">
            Den här chattsessionen har nått sin gräns. Kontakta oss gärna direkt så tar vi det
            därifrån.
          </div>
        )}
      </div>

      {/* 2. Aktuella val - fast placerad, visar bara senaste turens val. */}
      {currentQuickReplies.length > 0 && (
        <div
          className={cn(
            "shrink-0 border-t border-white/8",
            compact ? "px-4 py-2.5" : "px-6 py-2.5 sm:px-8",
          )}
        >
          <QuickReplyChips
            suggestions={currentQuickReplies}
            disabled={isBusy}
            onSelect={(value) => chat.submit(value)}
          />
        </div>
      )}

      {/* 3. Inmatning - alltid längst ned, aldrig bakom scroll. */}
      <ChatComposer
        inputId={compact ? `nova-chat-compact-${inputId}` : `nova-chat-page-${inputId}`}
        value={chat.draft}
        onChange={chat.setDraft}
        onSubmit={() => chat.submit()}
        disabled={isBusy || chat.status === "session-limit"}
        escalation={
          chat.messages.length > 0
            ? {
                urgency: chat.urgency,
                onClick: () => {
                  prepareHandoff();
                  onNavigate?.();
                },
                serviceSlug: chat.serviceSlug,
              }
            : undefined
        }
      />
    </div>
  );
}
