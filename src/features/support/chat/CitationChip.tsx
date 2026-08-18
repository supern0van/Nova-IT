import type { KnowledgeDoc } from "../support-knowledge";

/**
 * Källhänvisning för ett AI-svar som grundat sig i kunskapsbasen (se
 * `support-knowledge.ts`). Håller sig medvetet lågmäld - en liten numrerad
 * länk, inte ett stort visuellt element som konkurrerar med själva svaret.
 *
 * Vanlig `<a>`, inte routerns `Link`: käll-url:erna är dynamiska strängar
 * (inklusive ankare som `/assistent#wifi`) som inte är egna registrerade
 * rutter, så `Link`s ruttypade `to`-prop passar inte här.
 */
export function CitationChips({ docs }: { docs: KnowledgeDoc[] }) {
  if (docs.length === 0) return null;

  return (
    <div className="ml-9 flex flex-wrap gap-1.5">
      {docs.map((doc, index) => (
        <a
          key={doc.id}
          href={doc.sourceUrl}
          className="rounded border border-white/10 bg-white/[0.02] px-1.5 py-0.5 text-[11px] text-slate-400 transition-colors hover:border-sky-300/40 hover:text-sky-200"
        >
          [{index + 1}] {doc.title}
        </a>
      ))}
    </div>
  );
}
