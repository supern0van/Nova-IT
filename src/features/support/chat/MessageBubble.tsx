import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { CitationChips, type CitedDoc } from "./CitationChip";

/**
 * Ett meddelande i transcriptet. Bevarar bubbel-konventionen från den gamla
 * guiden (höger/tinted för kund, vänster/neutral för assistent) - den
 * matchade redan researchunderlagets rekommendation, så den återanvänds
 * medvetet i stället för att uppfinnas om.
 *
 * Ingen maskot, ingen avatar med ansikte - bara Nova IT-märket, samma
 * antropomorfiserings-återhållsamhet som resten av funktionen (se
 * `SupportBotLauncher.tsx`).
 */
export function MessageBubble({
  role,
  content,
  compact,
  citedDocs,
  isStreaming,
}: {
  role: "assistant" | "user";
  content: string;
  compact: boolean;
  citedDocs?: CitedDoc[];
  isStreaming?: boolean;
}) {
  const isAssistant = role === "assistant";

  return (
    <div className="space-y-2">
      <div className={cn("flex items-start gap-3", isAssistant ? "justify-start" : "justify-end")}>
        {isAssistant && (
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/[0.05] p-1">
            <img src="/nova-it-mark.svg" alt="" aria-hidden="true" className="h-full w-full" />
            <span className="sr-only">Nova IT ärendeguide</span>
          </span>
        )}
        <div
          className={cn(
            "text-sm",
            compact ? "max-w-[calc(100%-2rem)]" : "max-w-2xl",
            isAssistant
              ? "pt-0.5 text-slate-200"
              : "rounded-lg rounded-tr-sm bg-sky-300/[0.12] px-3 py-2 text-sky-50",
          )}
        >
          {isAssistant ? (
            <div className="leading-6">
              <ReactMarkdown
                // Medvetet INGEN "a" här. Modellens fritext ska bara beskriva
                // Nova IT och föreslå nästa steg (se byggChattSystemPrompt i
                // support-chat.ts) - den har aldrig ett legitimt behov av att
                // själv producera klickbara länkar. Riktiga källhänvisningar
                // renderas separat via CitationChips, med en hårdkodad
                // sourceUrl från kunskapsbasen, ALDRIG från modellens egen
                // text. Utan "a" i listan unwrappar unwrapDisallowed en
                // eventuell markdown-länk till bara sin synliga text i
                // stället för en klickbar `<a href>` - stänger dörren för att
                // en promptinjicerad eller hallucinerad länk (t.ex. en
                // phishing-url eller ett javascript:-schema) blir klickbar i
                // chatten.
                allowedElements={["p", "strong", "em", "ul", "ol", "li", "code"]}
                unwrapDisallowed
                components={{
                  p: (props) => <p {...props} className="mb-2 last:mb-0" />,
                  ul: (props) => <ul {...props} className="my-2 list-disc space-y-1 pl-5" />,
                  ol: (props) => <ol {...props} className="my-2 list-decimal space-y-1 pl-5" />,
                  code: (props) => (
                    <code {...props} className="rounded bg-white/8 px-1 py-0.5 text-[0.85em]" />
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
              {isStreaming && (
                <span
                  aria-hidden="true"
                  className="ml-0.5 inline-block h-4 w-[2px] motion-safe:animate-pulse bg-slate-400 align-middle"
                />
              )}
            </div>
          ) : (
            content
          )}
        </div>
      </div>
      {isAssistant && citedDocs && citedDocs.length > 0 && <CitationChips docs={citedDocs} />}
    </div>
  );
}
