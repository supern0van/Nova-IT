import {
  Headphones,
  Wifi,
  Monitor,
  Wrench,
  ShieldCheck,
  Cloud,
  type LucideIcon,
} from "lucide-react";

export type Service = {
  slug: string;
  title: string;
  icon: LucideIcon;
  description: string;
  examples: string[];
  difficulty: "Enkel" | "Medel" | "Avancerad";
};

export const services: Service[] = [
  {
    slug: "it-support",
    title: "IT-support",
    icon: Headphones,
    description:
      "Snabb hjälp när något krånglar — via telefon, chatt eller på plats.",
    examples: [
      "Skrivaren skriver inte ut",
      "Kan inte logga in på jobbdatorn",
      "Programmet startar inte",
    ],
    difficulty: "Enkel",
  },
  {
    slug: "natverk",
    title: "Nätverk och Wi-Fi",
    icon: Wifi,
    description:
      "Vi bygger och felsöker nätverk som håller — hemma och på kontoret.",
    examples: [
      "Svagt Wi-Fi i vissa rum",
      "Nytt nätverk till kontoret",
      "Gäst-Wi-Fi med säker separation",
    ],
    difficulty: "Medel",
  },
  {
    slug: "datorinstallation",
    title: "Datorinstallation",
    icon: Monitor,
    description:
      "Ny dator? Vi installerar, flyttar över filer och ser till att allt bara fungerar.",
    examples: [
      "Uppsättning av ny laptop",
      "Migrering av e-post och filer",
      "Standardiserad installation för team",
    ],
    difficulty: "Enkel",
  },
  {
    slug: "felsokning",
    title: "Felsökning",
    icon: Wrench,
    description:
      "Metodisk felsökning av krångliga problem som ingen annan får rätsida på.",
    examples: [
      "Datorn är långsam",
      "Återkommande blåskärmar",
      "Konstiga nätverksavbrott",
    ],
    difficulty: "Avancerad",
  },
  {
    slug: "sakerhet-backup",
    title: "Säkerhet och backup",
    icon: ShieldCheck,
    description:
      "Skydda verksamheten mot ransomware, dataförlust och mänskliga misstag.",
    examples: [
      "Automatiska backuper",
      "Tvåfaktorsinloggning",
      "Genomgång av behörigheter",
    ],
    difficulty: "Medel",
  },
  {
    slug: "microsoft-google",
    title: "Microsoft 365 / Google Workspace",
    icon: Cloud,
    description:
      "Uppsättning, migrering och support för molnkontor — utan onödig krångel.",
    examples: [
      "Byte från Google till Microsoft 365",
      "Delade postlådor och kalendrar",
      "Behörigheter i SharePoint / Drive",
    ],
    difficulty: "Medel",
  },
];

export const faqs = [
  {
    q: "Vad kostar det?",
    a: "Vi tar 895 kr/tim exkl. moms för företag och 695 kr/tim för privatpersoner. Löpande avtal ger lägre timpris. Du får alltid en tydlig uppskattning innan vi börjar.",
  },
  {
    q: "Hur snabbt får jag hjälp?",
    a: "Vardagar svarar vi normalt inom 1 timme. Akuta ärenden för avtalskunder prioriteras och hanteras oftast samma dag.",
  },
  {
    q: "Kan ni hjälpa på distans?",
    a: "Ja, de flesta ärenden löser vi via säker fjärranslutning. Du ser hela tiden vad vi gör och kan avbryta när som helst.",
  },
  {
    q: "Kommer ni ut på plats?",
    a: "Ja, vi arbetar på plats i hela Storstockholm. Vi tar en enkel framkörningsavgift utanför tätort.",
  },
  {
    q: "Hur hanterar ni min data?",
    a: "Vi följer GDPR, loggar all åtkomst och signerar sekretessavtal när det behövs. Kunddata lämnar aldrig EU.",
  },
  {
    q: "Hur fungerar backup?",
    a: "Vi sätter upp automatiska backuper till krypterad molnlagring och testar återställning regelbundet — en backup som inte går att återställa är ingen backup.",
  },
  {
    q: "Wi-Fi krånglar hemma, kan ni hjälpa?",
    a: "Absolut. Vi mäter täckning, byter kanaler, uppgraderar hårdvara vid behov och ser till att du får stabilt internet i hela bostaden.",
  },
  {
    q: "Hanterar ni företag utan egen IT-avdelning?",
    a: "Det är vår specialitet. Vi fungerar som ett litet företags externa IT-avdelning — med fast kontaktperson och tydliga rutiner.",
  },
];

export const assistantSuggestions = [
  "Wi-Fi fungerar inte",
  "Datorn är långsam",
  "Jag kommer inte in på Microsoft 365",
  "Jag behöver hjälp med backup",
];

export function getAssistantAnswer(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("wi-fi") || q.includes("wifi") || q.includes("internet")) {
    return "Testa först: starta om routern (dra ur strömmen i 30 sekunder). Kontrollera att andra enheter fungerar. Om bara en dator har problem, glöm nätverket och anslut igen. Kvarstår felet — boka support så mäter vi täckning och konfiguration.";
  }
  if (q.includes("långsam") || q.includes("seg") || q.includes("dator")) {
    return "Vanliga orsaker: full disk, för många program vid start, eller att datorn behöver en omstart. Starta om, avinstallera program du inte använder, och kontrollera diskutrymmet. Är den fortfarande seg kan det vara dags för SSD-uppgradering eller ominstallation.";
  }
  if (q.includes("microsoft") || q.includes("365") || q.includes("office") || q.includes("outlook")) {
    return "Prova att logga ut helt och in igen på portal.office.com. Kontrollera att lösenordet inte gått ut och att tvåfaktor fungerar. Låst konto? Din administratör kan låsa upp det — annars hjälper vi till.";
  }
  if (q.includes("backup") || q.includes("säkerhetskopi")) {
    return "En bra backup är automatisk, krypterad och testad. Vi sätter upp molnbackup för dokument, e-post och servrar, samt kör återställningstest varje kvartal så du vet att det faktiskt fungerar.";
  }
  return "Tack för din fråga! Det här är en förhandsversion av vår assistent. Beskriv gärna problemet i bokningsformuläret så återkommer en tekniker inom kort.";
}
