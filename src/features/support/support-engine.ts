import { supportFlows } from "./support-data";
import type {
  SupportFlow,
  SupportMatch,
  SupportOption,
  SupportSelection,
  SupportUrgency,
} from "./support-types";

/**
 * Ord som förekommer i nästan varje beskrivning ("min dator krånglar") och
 * därför inte säger något om VILKEN typ av ärende det är. De får noll vikt
 * i poängsättningen istället för att tas bort helt - annars skulle en fras
 * som "full disk" tappa sitt sammanhang.
 */
const genericTerms = new Set([
  "annat",
  "dator",
  "datorn",
  "fel",
  "fraga",
  "fungerar",
  "hjalp",
  "kranglar",
  "problem",
  "strular",
  "support",
]);

const urgentSecurityTerms = [
  "betalningskrav",
  "filer ar krypterade",
  "krypterade filer",
  "kapat konto",
  "kapad e post",
  "nagon har kommit in",
  "obehorig atkomst",
  "misstankt intrang",
  "konto kan vara kapat",
  "pengar har forsvunnit",
  "obehorig betalning",
  "ransom",
  "ransomware",
];

const priorityTerms = [
  "akut",
  "bradskande",
  "flera anvandare",
  "hela kontoret",
  "hela foreningen",
  "ligger nere",
  "star still",
  "stopp i arbetet",
  "kan inte jobba",
  "kan inte arbeta",
  "maste fungera idag",
];

const securityTerms = [
  "bedrageri",
  "blivit lurad",
  "hack",
  "hackad",
  "intrang",
  "kapat",
  "kapad",
  "klickat pa lank",
  "krypterade filer",
  "malware",
  "misstankt mail",
  "misstankt mejl",
  "misstankt sms",
  "natfiske",
  "okand lank",
  "phishing",
  "ransom",
  "ransomware",
  "skadlig kod",
  "virus",
];

/**
 * Datahaveri-termer styr INTE kategorin (det gör nyckelorden), men höjer
 * angelägenheten - en disk som låter konstigt tål inte att vänta en vecka.
 */
const dataLossTerms = [
  "disken later konstigt",
  "klickande ljud",
  "filer forsvunna",
  "filer ar borta",
  "raderat av misstag",
  "ingen backup",
];

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLocaleLowerCase("sv")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

/**
 * Klipper vanliga svenska böjningsändelser så att "långsamt", "långsamma"
 * och "långsam" räknas som samma ord. Medvetet trubbigt - en riktig
 * stemmer vore överdrivet här, och ett par falska träffar kostar mindre än
 * att missa hälften av alla naturliga formuleringar.
 */
function stem(word: string): string {
  if (word.length <= 4) return word;
  for (const suffix of [
    "arna",
    "erna",
    "orna",
    "ade",
    "aste",
    "are",
    "ar",
    "en",
    "et",
    "an",
    "or",
    "er",
    "a",
    "t",
    "n",
  ]) {
    if (word.length - suffix.length >= 4 && word.endsWith(suffix)) {
      return collapseDoubledEnding(word.slice(0, -suffix.length));
    }
  }
  return collapseDoubledEnding(word);
}

/**
 * Svensk böjning dubblerar ofta slutkonsonanten ("långsam" → "långsammare").
 * Utan den här kollapsen skulle stammarna bli "langsam" och "langsamm" och
 * aldrig mötas.
 */
function collapseDoubledEnding(word: string): string {
  if (word.length < 4) return word;
  const last = word.at(-1);
  return last && last === word.at(-2) ? word.slice(0, -1) : word;
}

function stemAll(value: string): string {
  return value.split(" ").filter(Boolean).map(stem).join(" ");
}

/**
 * Matchar en term mot texten på två nivåer: först exakt ordgräns, sedan
 * mot stammade former. Flerordsfraser ("krypterade filer") matchas som en
 * sammanhängande sekvens, aldrig som lösryckta ord.
 */
function containsTerm(normalizedQuery: string, stemmedQuery: string, term: string): boolean {
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return false;
  if (` ${normalizedQuery} `.includes(` ${normalizedTerm} `)) return true;
  const stemmedTerm = stemAll(normalizedTerm);
  return stemmedTerm.length > 0 && ` ${stemmedQuery} `.includes(` ${stemmedTerm} `);
}

function scoreTerm(term: string): number {
  const normalizedTerm = normalize(term);
  if (genericTerms.has(normalizedTerm)) return 0;
  const words = normalizedTerm.split(" ").filter(Boolean).length;
  // Längre och mer specifika termer väger tyngre; en flerordsfras är ett
  // betydligt starkare tecken än ett ensamt vanligt ord.
  return 4 + Math.min(normalizedTerm.length, 8) / 2 + Math.max(0, words - 1) * 4;
}

function getUrgency(
  normalizedQuery: string,
  stemmedQuery: string,
  flow: SupportFlow,
): SupportUrgency {
  if (
    flow.id === "virus" &&
    urgentSecurityTerms.some((term) => containsTerm(normalizedQuery, stemmedQuery, term))
  ) {
    return "urgent";
  }

  if (priorityTerms.some((term) => containsTerm(normalizedQuery, stemmedQuery, term))) {
    return "priority";
  }
  if (flow.id === "virus") return "priority";
  if (
    (flow.id === "backup" || flow.id === "external-storage") &&
    dataLossTerms.some((term) => containsTerm(normalizedQuery, stemmedQuery, term))
  ) {
    return "priority";
  }
  return "standard";
}

function getDefaultAlternatives(excludedId?: string): SupportFlow[] {
  return ["booking", "wifi", "account", "virus"]
    .map((id) => getSupportFlow(id))
    .filter((flow): flow is SupportFlow => flow !== undefined && flow.id !== excludedId)
    .slice(0, 3);
}

export function getSupportFlow(id: string | undefined): SupportFlow | undefined {
  return supportFlows.find((flow) => flow.id === id);
}

export function classifySupportQuery(query: string): SupportMatch {
  const normalizedQuery = normalize(query);
  const stemmedQuery = stemAll(normalizedQuery);
  const fallback = supportFlows[supportFlows.length - 1];

  if (!normalizedQuery) {
    return {
      flow: fallback,
      alternatives: getDefaultAlternatives(),
      confidence: "low",
      matchedTerms: [],
      requiresClarification: true,
      score: 0,
      urgency: "standard",
    };
  }

  const securityMatch = securityTerms.find((term) =>
    containsTerm(normalizedQuery, stemmedQuery, term),
  );
  const ranked = supportFlows
    .map((flow) => {
      const matchedTerms = flow.keywords.filter((keyword) =>
        containsTerm(normalizedQuery, stemmedQuery, keyword),
      );
      const score = matchedTerms.reduce((total, keyword) => total + scoreTerm(keyword), 0);
      return { flow, matchedTerms, score };
    })
    .sort(
      (left, right) =>
        right.score - left.score || left.flow.label.localeCompare(right.flow.label, "sv"),
    );

  let best = ranked[0];
  // Säkerhetsspåret vinner alltid över en högre poäng i ett annat spår.
  // Ett misstänkt intrång som beskrivs med orden "min e-post krånglar" ska
  // inte hamna i kontoflödet och behandlas som ett glömt lösenord.
  if (securityMatch) {
    const securityFlow = ranked.find((candidate) => candidate.flow.id === "virus");
    if (securityFlow) {
      best = {
        ...securityFlow,
        matchedTerms: Array.from(new Set([...securityFlow.matchedTerms, securityMatch])),
        score: Math.max(securityFlow.score, 20),
      };
    }
  }

  const secondBestScore =
    ranked.find((candidate) => candidate.flow.id !== best.flow.id)?.score ?? 0;
  const gap = best.score - secondBestScore;
  const confidence =
    securityMatch || best.score >= 12 || (best.score >= 6 && gap >= 3)
      ? "high"
      : best.score >= 4
        ? "medium"
        : "low";
  const meaningfulAlternatives = ranked
    .filter((candidate) => candidate.flow.id !== best.flow.id && candidate.score > 0)
    .slice(0, 2)
    .map((candidate) => candidate.flow);
  const alternatives = meaningfulAlternatives.length
    ? meaningfulAlternatives
    : getDefaultAlternatives(best.flow.id);

  return {
    flow: confidence === "low" ? fallback : best.flow,
    alternatives,
    confidence,
    matchedTerms: best.matchedTerms,
    requiresClarification: confidence === "low" || (confidence === "medium" && gap < 2),
    score: best.score,
    urgency: getUrgency(
      normalizedQuery,
      stemmedQuery,
      securityMatch ? getSupportFlow("virus")! : best.flow,
    ),
  };
}

export function matchSupportFlow(query: string): SupportFlow {
  return classifySupportQuery(query).flow;
}

export function getSupportOption(flow: SupportFlow, optionId: string): SupportOption | undefined {
  return flow.options.find((option) => option.id === optionId);
}

/**
 * Kundvänlig sammanfattning som visas i guiden och kan kopieras.
 * Se `createSupportTranscript` för den version som faktiskt följer med in i
 * adminportalens ärende.
 */
export function createSupportSummary({
  flow,
  impact,
  option,
  query,
  timing,
  urgency,
}: SupportSelection): string {
  const urgencyLabel =
    urgency === "urgent"
      ? "Akut säkerhetsläge"
      : urgency === "priority"
        ? "Prioriterat"
        : undefined;

  return [
    "Nova IT – förberett supportärende",
    `Område: ${flow.title}`,
    urgencyLabel ? `Prioritet: ${urgencyLabel}` : undefined,
    query ? `Beskrivning: ${query}` : undefined,
    option ? `Vald situation: ${option.label}` : undefined,
    impact ? `Påverkan: ${impact}` : undefined,
    timing ? `Tidsbild: ${timing}` : undefined,
    option ? `Viktigt underlag: ${option.reply}` : undefined,
    "Bra att ha med:",
    ...flow.firstSteps.map((step) => `- ${step}`),
    `När hjälp behövs: ${flow.escalation}`,
    "Nästa steg: kontakta Nova IT med sammanfattningen.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Den kompakta konversationsloggen som skickas vidare till adminportalen
 * som del av ärendets beskrivning. Till skillnad från
 * `createSupportSummary` innehåller den INTE guidens råd och checklistor -
 * de är till för kunden, inte för teknikern som ska läsa ärendet. Här
 * behålls bara det kunden faktiskt uttryckte: fritext och gjorda val.
 */
export function createSupportTranscript({
  flow,
  impact,
  option,
  query,
  timing,
  urgency,
}: SupportSelection): string {
  const urgencyLabel =
    urgency === "urgent"
      ? "Akut säkerhetsläge"
      : urgency === "priority"
        ? "Prioriterat"
        : undefined;

  return [
    `Guidat område: ${flow.title}`,
    urgencyLabel ? `Guidens bedömning: ${urgencyLabel}` : undefined,
    query ? `Kundens egna ord: ${query}` : undefined,
    option ? `${flow.question} → ${option.label}` : undefined,
    impact ? `Påverkan → ${impact}` : undefined,
    timing ? `Tidsbild → ${timing}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");
}
