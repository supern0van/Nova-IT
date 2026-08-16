export type SupportServiceSlug =
  | "it-support"
  | "natverk"
  | "datorinstallation"
  | "felsokning"
  | "sakerhet-backup"
  | "microsoft-google"
  | "datorservice";

export type SupportOption = {
  id: string;
  label: string;
  reply: string;
};

export type SupportFlow = {
  id: string;
  label: string;
  title: string;
  keywords: string[];
  intro: string;
  firstSteps: string[];
  escalation: string;
  question: string;
  options: SupportOption[];
  serviceSlug: SupportServiceSlug;
};

export type SupportSelection = {
  flow: SupportFlow;
  impact?: string;
  option?: SupportOption;
  query?: string;
  timing?: string;
  urgency?: SupportUrgency;
};

export type SupportDetailOption = {
  id: string;
  label: string;
};

export type SupportMatchConfidence = "high" | "medium" | "low";

export type SupportUrgency = "standard" | "priority" | "urgent";

export type SupportMatch = {
  flow: SupportFlow;
  alternatives: SupportFlow[];
  confidence: SupportMatchConfidence;
  matchedTerms: string[];
  requiresClarification: boolean;
  score: number;
  urgency: SupportUrgency;
};
