export type SupportServiceSlug =
  | "it-support"
  | "natverk"
  | "datorinstallation"
  | "felsokning"
  | "sakerhet-backup"
  | "microsoft-google";

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
  option?: SupportOption;
  query?: string;
};
