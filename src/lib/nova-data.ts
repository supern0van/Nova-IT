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
  "Berätta kort vad som krånglar. Svara på det du vet, så återkommer vi med hur vi bäst kan hjälpa.";

export const contactChannels = {
  contact: "kontakt@nova-it.se",
  support: "support@nova-it.se",
  general: "info@nova-it.se",
  webmaster: "webmaster@nova-it.se",
  noReply: "no-reply@nova-it.se",
  showOnContactPage: false,
};

export type Service = {
  slug: string;
  title: string;
  shortTitle: string;
  category: "Datorer och support" | "Nätverk och säkerhet";
  icon: LucideIcon;
  description: string;
  outcome: string;
  examples: string[];
};

export const services: Service[] = [
  {
    slug: "it-support",
    title: "IT-support",
    shortTitle: "Support",
    category: "Datorer och support",
    icon: Headphones,
    description: "Hjälp när datorer, skrivare, konton eller program inte fungerar som de ska.",
    outcome: "Vi går igenom problemet och hittar en rimlig väg vidare.",
    examples: [
      "Inloggning som inte fungerar",
      "Skrivare och tillbehör som krånglar",
      "Program som behöver installeras eller repareras",
    ],
  },
  {
    slug: "natverk",
    title: "Nätverk och Wi-Fi",
    shortTitle: "Nätverk",
    category: "Nätverk och säkerhet",
    icon: Wifi,
    description:
      "Planering, felsökning och förbättring av uppkoppling hemma, på kontor och i mindre verksamheter.",
    outcome: "En uppkoppling som fungerar bättre där den behövs.",
    examples: [
      "Svag Wi-Fi-täckning i vissa rum",
      "Separat gästnät för besökare",
      "Dokumenterad nätverkskarta",
    ],
  },
  {
    slug: "datorinstallation",
    title: "Datorinstallation",
    shortTitle: "Datorer",
    category: "Datorer och support",
    icon: Monitor,
    description:
      "Nya datorer, användarkonton, e-post, säkerhetsinställningar och överflytt av filer.",
    outcome: "En dator som är klar att använda, med rätt program och inställningar på plats.",
    examples: [
      "Ny laptop för medarbetare",
      "Flytt av e-post och dokument",
      "Standardiserad installation för team",
    ],
  },
  {
    slug: "felsokning",
    title: "Felsökning",
    shortTitle: "Felsökning",
    category: "Datorer och support",
    icon: Wrench,
    description: "Metodisk genomgång av återkommande fel där orsaken inte är uppenbar.",
    outcome: "En tydligare bild av vad som krånglar och vad som är värt att göra åt det.",
    examples: [
      "Långsam dator trots omstart",
      "Återkommande felmeddelanden",
      "Problem som bara uppstår ibland",
    ],
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
  },
  {
    slug: "microsoft-google",
    title: "Microsoft 365 / Google Workspace",
    shortTitle: "Molnkontor",
    category: "Datorer och support",
    icon: Cloud,
    description: "Hjälp med e-post, kalendrar, delade ytor, behörigheter och smartare samarbete.",
    outcome: "Ordning i vardagens verktyg och tydligare åtkomst för dem som behöver den.",
    examples: [
      "Delade postlådor och kalendrar",
      "Behörigheter i SharePoint eller Drive",
      "Flytt mellan Google och Microsoft 365",
    ],
  },
  {
    slug: "datorservice",
    title: "Datorservice och uppgradering",
    shortTitle: "Datorservice",
    category: "Datorer och support",
    icon: Wrench,
    description: "Bedömning av skick, prestanda och möjliga uppgraderingar.",
    outcome: "När du vill få mer ut av datorn.",
    examples: ["Byte till SSD", "Mer arbetsminne", "Rengöring och genomgång"],
  },
];

export const serviceAreas = [
  {
    title: "Datorer och vardags-IT",
    description:
      "När datorn, skrivaren, programmen eller installationen står i vägen för vardagen.",
    icon: Monitor,
    examples: "Support, felsökning, installation och uppgradering.",
  },
  {
    title: "Nätverk och Wi-Fi",
    description:
      "När uppkopplingen behöver fungera bättre hemma, på kontoret eller i en mindre verksamhet.",
    icon: Wifi,
    examples: "Wi-Fi, nätverk, gästnät och grundläggande dokumentation.",
  },
  {
    title: "Konton, moln och säkerhet",
    description:
      "När e-post, åtkomst, backup eller delade arbetsytor behöver bli tryggare och tydligare.",
    icon: ShieldCheck,
    examples: "Microsoft 365, Google Workspace, behörigheter och backup.",
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
    title: "Berätta vad som krånglar",
    text: "Du behöver inte kunna den tekniska orsaken. Beskriv bara vad du märker.",
  },
  {
    title: "Vi går igenom läget",
    text: "Vi återkommer med vad som är rimligt att kontrollera eller åtgärda.",
  },
  {
    title: "Vi hjälper dig vidare",
    text: "När vi vet mer planerar vi nästa steg tillsammans.",
  },
];

export const faqs = [
  {
    q: "Vad kan ni hjälpa mig med?",
    a: "Vi hjälper till när datorer, Wi-Fi, konton, program eller skrivare krånglar. Vi kan också se över installationer, nätverk och om en äldre dator går att uppgradera i stället för att bytas ut.",
  },
  {
    q: "Behöver jag veta vad som är fel innan jag hör av mig?",
    a: "Nej. Berätta vad som händer och när du märkte det. Vi hjälper dig att sortera resten.",
  },
  {
    q: "Hur snabbt får jag hjälp?",
    a: "Det beror på vad som har hänt och hur omfattande det är. Skriv gärna om problemet stoppar något viktigt, så återkommer vi med ett förslag på nästa steg.",
  },
  {
    q: "Hur beskriver jag ett ärende på bästa sätt?",
    a: "Skriv vad som inte fungerar, när problemet började och vad du redan har provat. Ett felmeddelande eller en bild kan också vara till hjälp.",
  },
  {
    q: "Vilka kunder passar upplägget för?",
    a: "Vi vänder oss till privatpersoner och mindre verksamheter som vill ha tydlig och praktisk hjälp när tekniken behöver fungera.",
  },
];

export function getServiceBySlug(slug: string | undefined) {
  return services.find((service) => service.slug === slug);
}
