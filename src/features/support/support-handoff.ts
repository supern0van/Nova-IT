import type { SupportServiceSlug, SupportUrgency } from "./support-types";

const STORAGE_KEY = "nova-it:support-handoff:v2";
const MAX_AGE_MS = 30 * 60 * 1000;
const MAX_TEXT_LENGTH = 500;

const serviceSlugs = new Set<SupportServiceSlug>([
  "it-support",
  "natverk",
  "datorinstallation",
  "felsokning",
  "sakerhet-backup",
  "microsoft-google",
]);

const urgencyLevels = new Set<SupportUrgency>(["standard", "priority", "urgent"]);

export type SupportHandoff = {
  version: 2;
  createdAt: number;
  contactReason: string;
  context: string;
  customerDescription: string;
  guidance: string;
  serviceSlug: SupportServiceSlug;
  urgency: SupportUrgency;
};

export function createSupportHandoff(
  input: Omit<SupportHandoff, "version" | "createdAt">,
  now = Date.now(),
): SupportHandoff {
  return {
    version: 2,
    createdAt: now,
    contactReason: input.contactReason.trim().slice(0, MAX_TEXT_LENGTH),
    context: input.context.trim().slice(0, MAX_TEXT_LENGTH),
    customerDescription: input.customerDescription.trim().slice(0, MAX_TEXT_LENGTH),
    guidance: input.guidance.trim().slice(0, MAX_TEXT_LENGTH),
    serviceSlug: input.serviceSlug,
    urgency: input.urgency,
  };
}

export function parseSupportHandoff(value: string, now = Date.now()): SupportHandoff | null {
  try {
    const parsed = JSON.parse(value) as Partial<SupportHandoff>;
    if (
      parsed.version !== 2 ||
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
