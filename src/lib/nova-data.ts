import {
  Cloud,
  Headphones,
  Monitor,
  ShieldCheck,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const contactNotice =
  "Beskriv problemet kort, bifoga gärna felmeddelanden och välj hur brådskande ärendet är. Underlaget gör det enklare att ta rätt nästa steg.";

const configuredContactEmail = import.meta.env.VITE_NOVA_CONTACT_EMAIL?.trim();

export const contactChannels = {
  email: configuredContactEmail || undefined,
};

export type Service = {
  slug: string;
  title: string;
  shortTitle: string;
  category: "Support och arbetsplats" | "Nätverk och säkerhet";
  icon: LucideIcon;
  description: string;
  outcome: string;
  examples: string[];
  difficulty: "Start" | "Standard" | "Fördjupad";
};

export const services: Service[] = [
  {
    slug: "it-support",
    title: "IT-support",
    shortTitle: "Support",
    category: "Support och arbetsplats",
    icon: Headphones,
    description:
      "Strukturerad hjälp när datorer, skrivare, konton eller program stoppar arbetsdagen.",
    outcome: "Snabb första sortering, tydlig nästa åtgärd och mindre avbrott i vardagen.",
    examples: [
      "Inloggning som inte fungerar",
      "Skrivare och tillbehör som krånglar",
      "Program som behöver installeras eller repareras",
    ],
    difficulty: "Start",
  },
  {
    slug: "natverk",
    title: "Nätverk och Wi-Fi",
    shortTitle: "Nätverk",
    category: "Nätverk och säkerhet",
    icon: Wifi,
    description:
      "Planering, felsökning och förbättring av stabil uppkoppling hemma, på kontor och i klassrum.",
    outcome: "Färre tappade mötesanslutningar och ett nät som går att felsöka när något händer.",
    examples: [
      "Svag Wi-Fi-täckning i vissa rum",
      "Separat gästnät för besökare",
      "Dokumenterad nätverkskarta",
    ],
    difficulty: "Standard",
  },
  {
    slug: "datorinstallation",
    title: "Datorinstallation",
    shortTitle: "Datorer",
    category: "Support och arbetsplats",
    icon: Monitor,
    description:
      "Nya datorer, användarkonton, e-post, säkerhetsinställningar och överflytt av filer.",
    outcome: "En startklar arbetsplats med rätt program, rätt behörigheter och mindre efterstrul.",
    examples: [
      "Ny laptop för medarbetare",
      "Flytt av e-post och dokument",
      "Standardiserad installation för team",
    ],
    difficulty: "Start",
  },
  {
    slug: "felsokning",
    title: "Felsökning",
    shortTitle: "Felsökning",
    category: "Support och arbetsplats",
    icon: Wrench,
    description: "Metodisk genomgång av återkommande fel där orsaken inte är uppenbar.",
    outcome: "Beslutsunderlag: vad som är fel, vad som är testat och vad som bör göras.",
    examples: [
      "Långsam dator trots omstart",
      "Återkommande felmeddelanden",
      "Problem som bara uppstår ibland",
    ],
    difficulty: "Fördjupad",
  },
  {
    slug: "sakerhet-backup",
    title: "Säkerhet och backup",
    shortTitle: "Säkerhet",
    category: "Nätverk och säkerhet",
    icon: ShieldCheck,
    description:
      "Grundläggande skydd, backup-rutiner och kontroll av behörigheter för mindre verksamheter.",
    outcome: "Bättre skydd mot misstag, kontoangrepp och dataförlust.",
    examples: [
      "Tvåfaktorsinloggning",
      "Automatiska säkerhetskopior",
      "Genomgång av användarroller",
    ],
    difficulty: "Standard",
  },
  {
    slug: "microsoft-google",
    title: "Microsoft 365 / Google Workspace",
    shortTitle: "Molnkontor",
    category: "Support och arbetsplats",
    icon: Cloud,
    description: "Hjälp med e-post, kalendrar, delade ytor, behörigheter och smartare samarbete.",
    outcome: "Ordning i vardagens verktyg och färre frågor om vem som kommer åt vad.",
    examples: [
      "Delade postlådor och kalendrar",
      "Behörigheter i SharePoint eller Drive",
      "Flytt mellan Google och Microsoft 365",
    ],
    difficulty: "Standard",
  },
];

export const serviceCategories = [
  {
    title: "Support och arbetsplats",
    description:
      "För ärenden som påverkar arbetsdagen direkt: datorer, konton, program, e-post och användarstöd.",
    serviceSlugs: ["it-support", "datorinstallation", "felsokning", "microsoft-google"],
  },
  {
    title: "Nätverk och säkerhet",
    description:
      "För stabil drift över tid: uppkoppling, backup, behörigheter och grundläggande säkerhet.",
    serviceSlugs: ["natverk", "sakerhet-backup"],
  },
] as const;

export const credibilityItems = [
  {
    title: "Tydlig första sortering",
    text: "Ärendet ringas in innan åtgärd så att rätt typ av hjälp kan planeras från start.",
  },
  {
    title: "Tydlig prioritering",
    text: "Kontaktflödet samlar problemtyp, brådska och påverkan innan en tekniker tar över.",
  },
  {
    title: "Säkerhet från start",
    text: "Copy och tjänster fokuserar på backup, behörigheter och dokumenterade åtgärder.",
  },
];

export const processSteps = [
  {
    title: "Beskriv läget",
    text: "Välj tjänst, brådska och vad som redan är testat.",
  },
  {
    title: "Få nästa steg",
    text: "Nova IT ger en tydlig rekommendation innan arbete påbörjas i en verklig leverans.",
  },
  {
    title: "Lös och dokumentera",
    text: "Åtgärder sammanfattas så att problemet inte behöver börja om från noll.",
  },
];

export const faqs = [
  {
    q: "Vilken typ av IT-hjälp kan Nova IT hjälpa med?",
    a: "Nova IT fokuserar på praktisk IT-support, datorproblem, nätverk, Wi-Fi, installationer, konton, säkerhet och backup för privatpersoner och mindre verksamheter.",
  },
  {
    q: "Vad kostar tjänsterna?",
    a: "Pris beror på ärendets omfattning, om hjälpen kan ges på distans och om utrustning eller längre felsökning behövs. Beskriv ärendet så kan Nova IT återkomma med rimligt nästa steg.",
  },
  {
    q: "Hur snabbt får jag hjälp?",
    a: "Beskriv hur arbetet, internet, kontoåtkomst eller viktiga filer påverkas. Nova IT kan sedan bedöma rätt prioritet och nästa steg.",
  },
  {
    q: "Kan ärenden lösas på distans?",
    a: "Många ärenden kan börja på distans, särskilt program, e-post, konton och enklare felsökning. Nätverk, hårdvara och installationer kan ibland kräva besök eller inlämning.",
  },
  {
    q: "Vad händer med uppgifterna i formuläret?",
    a: "Formuläret hjälper dig formulera ett tydligt underlag. Inför publicering kopplas det till vald kontaktlösning hos webbhotellet eller till ett e-postflöde.",
  },
  {
    q: "Hur beskriver jag ett ärende på bästa sätt?",
    a: "Skriv vad som inte fungerar, när problemet började och hur det påverkar dig eller verksamheten. Lägg gärna till felmeddelande, enhet och hur brådskande det är.",
  },
  {
    q: "Vilka kunder passar upplägget för?",
    a: "Nova IT riktar sig till privatpersoner och mindre verksamheter som vill ha begriplig hjälp med datorer, nätverk, konton och säkerhet.",
  },
  {
    q: "Hur hanteras säkerhet och backup?",
    a: "Säkerhet och backup behöver bedömas utifrån konton, behörigheter, viktig information och hur återställning fungerar vid ett avbrott.",
  },
];

export const assistantQuickActions = [
  {
    label: "Wi-Fi",
    prompt: "Wi-Fi fungerar inte i hela lokalen",
    serviceSlug: "natverk",
  },
  {
    label: "Långsam dator",
    prompt: "Datorn är långsam och startar program väldigt segt",
    serviceSlug: "felsokning",
  },
  {
    label: "Microsoft 365",
    prompt: "Jag kommer inte in på Microsoft 365 eller Outlook",
    serviceSlug: "microsoft-google",
  },
  {
    label: "Backup",
    prompt: "Jag vill veta om vår backup verkligen fungerar",
    serviceSlug: "sakerhet-backup",
  },
  {
    label: "E-post och filer",
    prompt: "E-post, delade filer eller behörigheter fungerar inte",
    serviceSlug: "microsoft-google",
  },
];

export type AssistantAnswer = {
  title: string;
  summary: string;
  steps: string[];
  escalation: string;
  serviceSlug: string;
};

const fallbackAnswer: AssistantAnswer = {
  title: "Nova IT behöver lite mer information",
  summary: "Problemet behöver sorteras innan rätt typ av support kan föreslås.",
  steps: [
    "Beskriv vad som inte fungerar och när det började.",
    "Skriv om det gäller en person, en enhet eller flera.",
    "Lägg till felmeddelanden eller skärmbilder när du kontaktar Nova IT.",
  ],
  escalation:
    "Kontakta Nova IT om problemet stoppar arbete, påverkar flera personer eller rör inloggning och säkerhet.",
  serviceSlug: "it-support",
};

export function getServiceBySlug(slug: string | undefined) {
  return services.find((service) => service.slug === slug);
}

export function getAssistantAnswer(question: string): AssistantAnswer {
  const q = question.toLowerCase();

  if (q.includes("wi-fi") || q.includes("wifi") || q.includes("internet")) {
    return {
      title: "Första kontroll för nätverk",
      summary: "När uppkopplingen krånglar behöver Nova IT veta omfattning, plats och påverkan.",
      steps: [
        "Skriv om problemet gäller alla enheter eller bara en dator/mobil.",
        "Notera var uppkopplingen är sämst och när avbrotten händer.",
        "Beskriv hur problemet påverkar arbete, möten eller vardagsanvändning.",
      ],
      escalation:
        "Gå vidare till formuläret om felet återkommer, påverkar möten eller om gästnät/säkerhet behöver ses över.",
      serviceSlug: "natverk",
    };
  }

  if (q.includes("långsam") || q.includes("seg") || q.includes("dator")) {
    return {
      title: "Sortera långsam dator",
      summary:
        "En långsam dator behöver bedömas efter symptom, ålder, användning och hur akut problemet är.",
      steps: [
        "Skriv när datorn känns långsam och om det gäller ett program eller allt.",
        "Ta fram modell och ungefärlig ålder om du känner till det.",
        "Beskriv om problemet stoppar arbete eller kan planeras in.",
      ],
      escalation:
        "Gå vidare till formuläret om datorn är seg, blir varm, visar fel eller används i arbete.",
      serviceSlug: "felsokning",
    };
  }

  if (
    q.includes("microsoft") ||
    q.includes("365") ||
    q.includes("office") ||
    q.includes("outlook") ||
    q.includes("e-post") ||
    q.includes("mail") ||
    q.includes("behörighet")
  ) {
    return {
      title: "Beskriv konto och åtkomst",
      summary:
        "Problem med Microsoft 365 handlar ofta om lösenord, tvåfaktor, licens eller behörighet.",
      steps: [
        "Skriv vilken tjänst eller app det gäller.",
        "Notera om kontot är låst, MFA saknas eller lösenordet inte fungerar.",
        "Skriv om fler användare är påverkade eller bara en person.",
      ],
      escalation:
        "Gå vidare till formuläret om konton, licenser, delade postlådor eller behörigheter behöver gås igenom.",
      serviceSlug: "microsoft-google",
    };
  }

  if (q.includes("backup") || q.includes("säkerhetskopi") || q.includes("återställ")) {
    return {
      title: "Backup behöver testas, inte bara finnas",
      summary: "En trygg backup är automatisk, skyddad och regelbundet testad med återläsning.",
      steps: [
        "Skriv vilka filer och system som är viktigast.",
        "Notera var backupen finns och vem som brukar hantera den.",
        "Låt Nova IT bedöma återställning innan viktiga filer skrivs över.",
      ],
      escalation:
        "Gå vidare till formuläret om ni saknar testad återläsning eller om bara en person vet hur backupen fungerar.",
      serviceSlug: "sakerhet-backup",
    };
  }

  return fallbackAnswer;
}
