import type { KnowledgeDoc } from "../support-knowledge";

/** Ett citerat dokument TILLSAMMANS MED numret modellen faktiskt använde
 *  för det i sitt svar (se byggChattSystemPrompt i support-chat.ts, som
 *  numrerar underlaget [1], [2], ... och ber modellen citera med samma
 *  nummer). Numret måste följa med hela vägen hit. */
export type CitedDoc = { doc: KnowledgeDoc; nummer: number };

/**
 * Källhänvisning för ett AI-svar som grundat sig i kunskapsbasen (se
 * `support-knowledge.ts`). Håller sig medvetet lågmäld - en liten numrerad
 * länk, inte ett stort visuellt element som konkurrerar med själva svaret.
 *
 * Numret som visas ([n]) är EXAKT samma nummer som modellens svarstext
 * refererar till - regression för ett tidigare fel där chippen omnumrerade
 * den filtrerade (bara citerade) listan från 1 igen, så en text som sa
 * "...enligt [3]" kunde visa en chip märkt "[1]" i stället för "[3]".
 *
 * Vanlig `<a>`, inte routerns `Link`: käll-url:erna är dynamiska strängar
 * (inklusive ankare som `/assistent#wifi`) som inte är egna registrerade
 * rutter, så `Link`s ruttypade `to`-prop passar inte här.
 */
export function CitationChips({ docs }: { docs: CitedDoc[] }) {
  if (docs.length === 0) return null;

  return (
    <div className="ml-9 flex flex-wrap gap-1.5">
      {docs.map(({ doc, nummer }) => (
        <a
          key={doc.id}
          href={doc.sourceUrl}
          className="rounded border border-white/10 bg-white/[0.02] px-1.5 py-0.5 text-[11px] text-slate-400 transition-colors hover:border-sky-300/40 hover:text-sky-200"
        >
          [{nummer}] {doc.title}
        </a>
      ))}
    </div>
  );
}
