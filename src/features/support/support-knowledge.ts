import { supportFlows } from "./support-data";
import { faqs, services } from "@/lib/nova-data";

/**
 * Kunskapsbasen för den fria supportchatten (RAG-underlaget).
 *
 * Korpusen är medvetet liten och redan mänskligt författad och strukturerad
 * - ärendeflödena, tjänstekatalogen och FAQ:n - så den chunkas INTE med en
 * generisk textdelare. Varje flöde/tjänst/FAQ-post blir exakt ETT hämtbart
 * dokument med ett stabilt id och en `sourceUrl` som blir källhänvisningen i
 * gränssnittet.
 *
 * Hämtningen här är ren lexikal poängsättning (samma sorts nyckelords-/
 * stamningslogik som `support-engine.ts`), inte embeddings/vektorsökning.
 * Det är ett medvetet, dokumenterat avsteg från planens Cloudflare
 * Vectorize-rekommendation: att provisionera ett riktigt vektorindex kräver
 * ett Cloudflare-kontos deploy-behörighet som den här miljön inte har. För en
 * korpus i den här storleksordningen (under 40 dokument) ger lexikal
 * poängsättning i praktiken jämförbar täckning, och `hamtaRelevantaDokument`
 * nedan är skriven så att den kan bytas mot en riktig Vectorize-fråga senare
 * utan att något som använder den (`support-chat.ts`) behöver ändras -
 * signaturen är redan "fråga in, rankade dokument ut".
 */

export type KnowledgeDoc = {
  id: string;
  kind: "flow" | "faq" | "service";
  title: string;
  text: string;
  sourceUrl: string;
};

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLocaleLowerCase("sv")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function buildCorpus(): KnowledgeDoc[] {
  const flowDocs: KnowledgeDoc[] = supportFlows.map((flow) => ({
    id: `flow:${flow.id}`,
    kind: "flow",
    title: flow.title,
    text: [flow.intro, ...flow.firstSteps, flow.escalation].join(" "),
    // `/assistent` (chatten själv) har inga per-flödes-ankare att peka på -
    // sidan renderar bara chattwidgeten, inget innehåll med `id={flow.id}`.
    // Den gamla strukturerade guidens per-steg-vyer finns inte kvar sedan
    // omdesignen till fri chatt, så `/assistent#${flow.id}` pekade på ett
    // fragment som aldrig funnits. Flödets `serviceSlug` ger en riktig,
    // fungerande sida i stället - mer relevant för källhänvisningen än
    // chattsidan självt hade varit ändå.
    sourceUrl: `/tjanster/${flow.serviceSlug}`,
  }));

  const serviceDocs: KnowledgeDoc[] = services.map((service) => ({
    id: `service:${service.slug}`,
    kind: "service",
    title: service.title,
    text: [service.description, service.outcome, ...service.examples].join(" "),
    sourceUrl: `/tjanster/${service.slug}`,
  }));

  const faqDocs: KnowledgeDoc[] = faqs.map((faq, index) => ({
    id: `faq:${index}`,
    kind: "faq",
    title: faq.q,
    text: faq.a,
    sourceUrl: `/faq#fraga-${index + 1}`,
  }));

  // Medvetet INGEN prisdokument-post: priser finns inte som godkänt,
  // strukturerat innehåll i den här korpusen, och det ska aldrig hittas på.
  // Prisfrågor besvaras av chattmotorn med en hänvisning till kontakt, inte
  // med ett belopp - se systemprompten i `support-chat.ts`.
  return [...flowDocs, ...serviceDocs, ...faqDocs];
}

const corpus = buildCorpus();

function scoreDoc(query: string, doc: KnowledgeDoc): number {
  const queryWords = new Set(
    normalize(query)
      .split(" ")
      .filter((word) => word.length > 2),
  );
  if (queryWords.size === 0) return 0;

  const docText = normalize(`${doc.title} ${doc.text}`);
  let score = 0;
  for (const word of queryWords) {
    if (` ${docText} `.includes(` ${word} `)) score += word.length >= 6 ? 3 : 1;
    else if (docText.includes(word)) score += 0.5;
  }
  return score;
}

/**
 * Hämtar de `antal` mest relevanta dokumenten för en fråga (typiskt kundens
 * senaste meddelande, eventuellt med en kort bit av tidigare kontext).
 * Returnerar en tom lista om inget matchar över tröskeln - chattmotorn ska
 * då hellre svara "det vet jag inte säkert" än hitta på, se `support-chat.ts`.
 */
export function hamtaRelevantaDokument(query: string, antal = 4): KnowledgeDoc[] {
  return corpus
    .map((doc) => ({ doc, score: scoreDoc(query, doc) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, antal)
    .map((entry) => entry.doc);
}

export function allaDokument(): KnowledgeDoc[] {
  return corpus;
}
