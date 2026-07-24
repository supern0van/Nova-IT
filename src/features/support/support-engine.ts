import { supportFlows } from "./support-data";
import type {
  SupportFlow,
  SupportMatch,
  SupportOption,
  SupportSelection,
  SupportUrgency,
} from "./support-types";

const genericTerms = new Set([
  "annat",
  "dator",
  "fel",
  "fraga",
  "fungerar",
  "hjalp",
  "kranglar",
  "problem",
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
  "ransom",
];

const priorityTerms = [
  "akut",
  "flera anvandare",
  "hela kontoret",
  "ligger nere",
  "star still",
  "stopp i arbetet",
];

const securityTerms = [
  "bedrageri",
  "hack",
  "intrang",
  "kapat",
  "kapad",
  "klickat pa lank",
  "krypterade filer",
  "malware",
  "misstankt mail",
  "misstankt mejl",
  "okand lank",
  "phishing",
  "ransom",
  "virus",
];

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLocaleLowerCase("sv")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function containsTerm(normalizedQuery: string, term: string): boolean {
  const normalizedTerm = normalize(term);
  return normalizedTerm.length > 0 && ` ${normalizedQuery} `.includes(` ${normalizedTerm} `);
}

function scoreTerm(term: string): number {
  const normalizedTerm = normalize(term);
  if (genericTerms.has(normalizedTerm)) return 0;
  const words = normalizedTerm.split(" ").filter(Boolean).length;
  return 4 + Math.min(normalizedTerm.length, 8) / 2 + Math.max(0, words - 1) * 4;
}

function getUrgency(normalizedQuery: string, flow: SupportFlow): SupportUrgency {
  if (
    flow.id === "virus" &&
    urgentSecurityTerms.some((term) => containsTerm(normalizedQuery, term))
  ) {
    return "urgent";
  }

  if (priorityTerms.some((term) => containsTerm(normalizedQuery, term))) return "priority";
  if (flow.id === "virus") return "priority";
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

  const securityMatch = securityTerms.find((term) => containsTerm(normalizedQuery, term));
  const ranked = supportFlows
    .map((flow) => {
      const matchedTerms = flow.keywords.filter((keyword) =>
        containsTerm(normalizedQuery, keyword),
      );
      const score = matchedTerms.reduce((total, keyword) => total + scoreTerm(keyword), 0);
      return { flow, matchedTerms, score };
    })
    .sort(
      (left, right) =>
        right.score - left.score || left.flow.label.localeCompare(right.flow.label, "sv"),
    );

  let best = ranked[0];
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
    urgency: getUrgency(normalizedQuery, securityMatch ? getSupportFlow("virus")! : best.flow),
  };
}

export function matchSupportFlow(query: string): SupportFlow {
  return classifySupportQuery(query).flow;
}

export function getSupportOption(flow: SupportFlow, optionId: string): SupportOption | undefined {
  return flow.options.find((option) => option.id === optionId);
}

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
