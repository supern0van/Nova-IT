import {
  Cloud,
  Headphones,
  Monitor,
  ShieldCheck,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const demoNotice =
  "Nova IT är ett fiktivt demoexempel. Kontaktuppgifter, svarstider och processer visar hur en kundredo webbplats kan fungera, inte uppgifter om ett verkligt bolag.";

export const contactChannels = {
  email: "demo@novait.example",
  availability: "Vardagar 08.00-17.00 i demoexemplet",
  location: "Stockholm, fiktivt upptagningsområde",
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
    title: "Tydligt demoexempel",
    text: "Inga påhittade siffror, inget organisationsnummer och inga adresser som kan misstas för verkliga.",
  },
  {
    title: "Tydlig prioritering",
    text: "Formulär och supportguide samlar rätt information innan en tekniker tar över i en skarp leverans.",
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
    q: "Är Nova IT ett riktigt företag?",
    a: "Nej. Nova IT är ett fiktivt demoexempel för en svensk IT-supportwebb. Därmed visar sajten inga verkliga organisationsnummer, adresser eller kundsiffror.",
  },
  {
    q: "Vad kostar tjänsterna?",
    a: "Demon innehåller inga bindande priser. På en skarp sajt skulle timpris, startavgift, avtal och eventuella framkörningskostnader beskrivas tydligt innan bokning.",
  },
  {
    q: "Hur snabbt får jag hjälp?",
    a: "Svarstiderna på sajten är formulerade som ett exempel på servicenivå. En verklig leverans skulle koppla svarstid till avtal, öppettider och ärendets brådska.",
  },
  {
    q: "Kan ärenden lösas på distans?",
    a: "Många vanliga IT-ärenden kan förberedas för distanssupport. I en verklig implementation skulle rutiner för fjärråtkomst, samtycke och loggning beskrivas innan anslutning.",
  },
  {
    q: "Vad händer med uppgifterna i formuläret?",
    a: "I den här demon skickas formuläret inte till någon server. Det visar validering, tillgänglighet och ett tänkt flöde för en framtida integration.",
  },
  {
    q: "Kan supportguiden ersätta en tekniker?",
    a: "Nej. Guiden är en demo med fördefinierade svar. Den hjälper besökaren att sortera ärendet, men gör inga AI-anrop och tar inga beslut.",
  },
  {
    q: "Vilka kunder passar upplägget för?",
    a: "Exemplet är skrivet för mindre företag, skolor och privatpersoner som behöver begriplig IT-hjälp utan en egen stor IT-avdelning.",
  },
  {
    q: "Hur hanteras säkerhet och backup?",
    a: "Sajten visar rekommenderade områden: tvåfaktor, behörighetsgenomgång, dokumenterade rutiner och testad återläsning. Det är exempel, inte en faktisk drifttjänst.",
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
  title: "Bra att samla mer information",
  summary:
    "Den här guiden känner inte igen alla problem, men du kan ändå förbereda ett tydligt ärende.",
  steps: [
    "Skriv ner vad som inte fungerar och när det började.",
    "Notera om felet gäller en person, en enhet eller alla.",
    "Bifoga felmeddelanden eller skärmbilder i en verklig supportkanal.",
  ],
  escalation:
    "Gå vidare till formuläret om problemet stoppar arbete, påverkar flera personer eller rör inloggning och säkerhet.",
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
      summary:
        "När uppkopplingen krånglar är målet att skilja på enhetsfel, täckningsproblem och leverantörsfel.",
      steps: [
        "Kontrollera om problemet gäller alla enheter eller bara en dator/mobil.",
        "Starta om router eller accesspunkt och vänta tills lamporna är stabila.",
        "Testa nära utrustningen. Fungerar det där, pekar det på täckning eller placering.",
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
        "Långsamhet beror ofta på lagring, uppstartsprogram, uppdateringar eller hårdvara som behöver ses över.",
      steps: [
        "Starta om datorn och kontrollera om problemet finns direkt efter omstart.",
        "Se om disken nästan är full och stäng program som startar automatiskt.",
        "Notera om felet gäller ett specifikt program eller hela datorn.",
      ],
      escalation:
        "Gå vidare till formuläret om datorn fortsätter vara seg efter omstart, om den blir varm eller om felmeddelanden visas.",
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
      title: "Kontrollera konto och åtkomst",
      summary:
        "Problem med Microsoft 365 handlar ofta om lösenord, tvåfaktor, licens eller behörighet.",
      steps: [
        "Testa inloggning i webbläsaren via Microsofts portal.",
        "Kontrollera om tvåfaktorkoden kommer fram och om kontot är låst.",
        "Se om fler användare har samma problem eller om det gäller en person.",
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
        "Kontrollera när senaste backupen kördes och om den rapporterade fel.",
        "Verifiera att viktiga mappar, e-post och system faktiskt omfattas.",
        "Gör ett litet återläsningstest till separat plats.",
      ],
      escalation:
        "Gå vidare till formuläret om ni saknar testad återläsning eller om bara en person vet hur backupen fungerar.",
      serviceSlug: "sakerhet-backup",
    };
  }

  return fallbackAnswer;
}
