import { supportFlows } from "./support-data";
import type { SupportFlow, SupportOption, SupportSelection } from "./support-types";

export function getSupportFlow(id: string | undefined): SupportFlow | undefined {
  return supportFlows.find((flow) => flow.id === id);
}

export function matchSupportFlow(query: string): SupportFlow {
  const normalized = query.trim().toLocaleLowerCase("sv");
  if (!normalized) return supportFlows[supportFlows.length - 1];

  let bestFlow = supportFlows[supportFlows.length - 1];
  let bestScore = 0;

  for (const flow of supportFlows) {
    const score = flow.keywords.reduce(
      (total, keyword) => total + (normalized.includes(keyword) ? keyword.length : 0),
      0,
    );
    if (score > bestScore) {
      bestFlow = flow;
      bestScore = score;
    }
  }

  return bestFlow;
}

export function getSupportOption(flow: SupportFlow, optionId: string): SupportOption | undefined {
  return flow.options.find((option) => option.id === optionId);
}

export function createSupportSummary({ flow, option, query }: SupportSelection): string {
  return [
    "Nova IT – förberett supportärende",
    `Område: ${flow.title}`,
    query ? `Beskrivning: ${query}` : undefined,
    option ? `Vald situation: ${option.label}` : undefined,
    option ? `Viktigt underlag: ${option.reply}` : undefined,
    `Föreslagen tjänst: ${flow.serviceSlug}`,
    "Nästa steg: kontakta Nova IT med sammanfattningen.",
  ]
    .filter(Boolean)
    .join("\n");
}
