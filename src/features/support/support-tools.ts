import type { SupportServiceSlug, SupportUrgency } from "./support-types";

/**
 * Kodstyrda säkerhetsspärrar för den fria chatten - det som ersätter dagens
 * slutna `flowId`-whitelist (se `support-ai.ts`) nu när modellens svar är
 * fri text i stället för ett enda validerat id.
 *
 * Grundprincipen är oförändrad: modellen får FÖRESLÅ, aldrig ensam BESTÄMMA.
 * Allt som styr kod - eskaleringsnivå, vilken tjänst ärendet hör till,
 * vilket underlag som skickas vidare - går via de strukturerade fälten här,
 * aldrig via att koden litar på fri prosa. Se docs/changes för resonemanget
 * bakom att detta är svagare än den gamla slutna listan, och varför det
 * kompenseras i flera lager i stället för att återskapas exakt.
 */

const urgencyOrder: Record<SupportUrgency, number> = { standard: 0, priority: 1, urgent: 2 };
const urgencyValues = new Set<SupportUrgency>(["standard", "priority", "urgent"]);

export function isSupportUrgency(value: unknown): value is SupportUrgency {
  return typeof value === "string" && urgencyValues.has(value as SupportUrgency);
}

/**
 * Slår samman regelmotorns nyckelordsbaserade eskaleringsnivå med modellens
 * egen bedömning. Modellen kan HÖJA nivån (den kan se sammanhang regelmotorn
 * missar, t.ex. över flera turer), men aldrig SÄNKA den regelmotorn redan
 * satt - exakt samma princip som "säkerhetsspåret vinner alltid" i dagens
 * `classifySupportQuery`, bara uttryckt som en explicit, testbar funktion i
 * stället för implicit i en enda matchningsfunktion.
 */
export function resolveUrgency(
  ruleUrgency: SupportUrgency,
  modelUrgency: SupportUrgency | null | undefined,
): SupportUrgency {
  if (!modelUrgency || !urgencyValues.has(modelUrgency)) return ruleUrgency;
  return urgencyOrder[modelUrgency] > urgencyOrder[ruleUrgency] ? modelUrgency : ruleUrgency;
}

const supportServiceSlugs = new Set<SupportServiceSlug>([
  "it-support",
  "natverk",
  "datorinstallation",
  "felsokning",
  "sakerhet-backup",
  "microsoft-google",
  "datorservice",
]);

export function isSupportServiceSlug(value: unknown): value is SupportServiceSlug {
  return typeof value === "string" && supportServiceSlugs.has(value as SupportServiceSlug);
}

/** Max antal och längd på AI-föreslagna snabbsvarsknappar - se B.5 i
 *  omdesignplanen. Håller dem korta av samma skäl som quick-replies alltid
 *  ska vara: en knapp man kan läsa på en halv sekund, inte en mening. */
const MAX_QUICK_REPLIES = 4;
const MAX_QUICK_REPLY_LENGTH = 40;

export function sanitizeQuickReplies(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && entry.length <= MAX_QUICK_REPLY_LENGTH)
    .slice(0, MAX_QUICK_REPLIES);
}

/**
 * Andra försvarslinjen mot att modellen ger felsökningsråd i stället för att
 * bara samla underlag - samma produktregel som testas mot den hårdkodade
 * copyn i `support-engine.test.ts`, nu tillämpad på fri text. Detta är en
 * heuristik, inte en garanti (se docs/changes för varför fri text
 * ofrånkomligt är ett svagare skydd än den gamla slutna listan) - träffar
 * den, byts HELA svaret ut mot en kort, ärlig linje i stället för att
 * försöka klippa ut enskilda meningar, eftersom en halvredigerad AI-mening
 * lätt blir obegriplig.
 */
const felsokningsmonster =
  /\b(starta om|rensa registret|installera om|kör kommandot|öppna terminalen|avinstallera och installera|återställ fabriksinställningar|byt ut (grafikkortet|minnet|disken)|uppdatera drivrutin(en|erna)?)\b/i;

export const FELSOKNING_ERSATTNINGSSVAR =
  "Jag samlar underlag till ärendet, jag felsöker inte här - men jag kan hjälpa dig beskriva det du märker.";

export function sanitizeReply(reply: string): string {
  const trimmed = reply.trim();
  if (!trimmed) return FELSOKNING_ERSATTNINGSSVAR;
  return felsokningsmonster.test(trimmed) ? FELSOKNING_ERSATTNINGSSVAR : trimmed;
}
