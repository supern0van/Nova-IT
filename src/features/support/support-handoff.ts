import type { SupportServiceSlug, SupportUrgency } from "./support-types";

const STORAGE_KEY = "nova-it:support-handoff:v3";
const MAX_AGE_MS = 30 * 60 * 1000;
const MAX_TEXT_LENGTH = 500;
// Hela transkriptet ska rymmas inom adminportalens hårda gräns för ärendets
// beskrivning (2000 tecken totalt, se `arGiltigMeddelande` i adminportalens
// `publikt-intag-server.ts`) TILLSAMMANS med kundens egna fritext i
// kontaktformuläret. `composeContactMessage` i `contact-submission.ts` gör
// den slutgiltiga, säkra kortningen - den här gränsen är bara en förhandsvakt
// så att inget orimligt stort någonsin sparas i webbläsaren.
const MAX_TRANSCRIPT_LENGTH = 1600;

const serviceSlugs = new Set<SupportServiceSlug>([
  "it-support",
  "natverk",
  "datorinstallation",
  "felsokning",
  "sakerhet-backup",
  "microsoft-google",
  "datorservice",
]);

const urgencyLevels = new Set<SupportUrgency>(["standard", "priority", "urgent"]);

export type SupportHandoff = {
  version: 3;
  createdAt: number;
  contactReason: string;
  context: string;
  customerDescription: string;
  guidance: string;
  /**
   * Hela den guidade konversationen (område, val, påverkan, tidsbild) som
   * löpande text - det här är "loggen" som följer med in i adminportalens
   * ärende, inte bara en enradssammanfattning. Se `createSupportSummary` i
   * `support-engine.ts`, som bygger denna text.
   */
  transcript: string;
  serviceSlug: SupportServiceSlug;
  urgency: SupportUrgency;
};

export function createSupportHandoff(
  input: Omit<SupportHandoff, "version" | "createdAt">,
  now = Date.now(),
): SupportHandoff {
  return {
    version: 3,
    createdAt: now,
    contactReason: input.contactReason.trim().slice(0, MAX_TEXT_LENGTH),
    context: input.context.trim().slice(0, MAX_TEXT_LENGTH),
    customerDescription: input.customerDescription.trim().slice(0, MAX_TEXT_LENGTH),
    guidance: input.guidance.trim().slice(0, MAX_TEXT_LENGTH),
    transcript: input.transcript.trim().slice(0, MAX_TRANSCRIPT_LENGTH),
    serviceSlug: input.serviceSlug,
    urgency: input.urgency,
  };
}

export function parseSupportHandoff(value: string, now = Date.now()): SupportHandoff | null {
  try {
    const parsed = JSON.parse(value) as Partial<SupportHandoff>;
    if (
      parsed.version !== 3 ||
      typeof parsed.createdAt !== "number" ||
      parsed.createdAt > now + 60_000 ||
      now - parsed.createdAt > MAX_AGE_MS ||
      typeof parsed.serviceSlug !== "string" ||
      !serviceSlugs.has(parsed.serviceSlug as SupportServiceSlug) ||
      typeof parsed.contactReason !== "string" ||
      parsed.contactReason.trim().length < 3 ||
      parsed.contactReason.length > MAX_TEXT_LENGTH ||
      typeof parsed.context !== "string" ||
      parsed.context.length > MAX_TEXT_LENGTH ||
      typeof parsed.customerDescription !== "string" ||
      parsed.customerDescription.length > MAX_TEXT_LENGTH ||
      typeof parsed.guidance !== "string" ||
      parsed.guidance.trim().length < 3 ||
      parsed.guidance.length > MAX_TEXT_LENGTH ||
      typeof parsed.transcript !== "string" ||
      parsed.transcript.length > MAX_TRANSCRIPT_LENGTH ||
      typeof parsed.urgency !== "string" ||
      !urgencyLevels.has(parsed.urgency as SupportUrgency)
    ) {
      return null;
    }

    return parsed as SupportHandoff;
  } catch {
    return null;
  }
}

export function saveSupportHandoff(handoff: SupportHandoff): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(handoff));
    return true;
  } catch {
    return false;
  }
}

export function consumeSupportHandoff(now = Date.now()): SupportHandoff | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
    return value ? parseSupportHandoff(value, now) : null;
  } catch {
    return null;
  }
}
