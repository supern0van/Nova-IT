import type { SupportDetailOption, SupportFlow } from "./support-types";

export const supportImpactOptions: SupportDetailOption[] = [
  { id: "one", label: "En person eller enhet" },
  { id: "several", label: "Flera personer eller enheter" },
  { id: "blocked", label: "Arbetet står still" },
  { id: "planned", label: "Det kan planeras" },
];

export const supportTimingOptions: SupportDetailOption[] = [
  { id: "recent", label: "Det började nyligen" },
  { id: "recurring", label: "Det kommer och går" },
  { id: "after-change", label: "Efter en ändring eller uppdatering" },
  { id: "unknown", label: "Jag är osäker" },
];

export const supportFlows: SupportFlow[] = [
  {
    id: "slow-computer",
    label: "Långsam dator",
    title: "Långsam dator",
    keywords: ["långsam", "seg", "trög", "hänger", "prestanda", "full disk"],
    intro: "En långsam dator behöver bedömas utifrån symptom, ålder, lagring och hur den används.",
    firstSteps: [
      "Notera om hela datorn eller bara ett program är långsamt.",
      "Skriv när problemet märks mest: start, webbläsare, möten eller arbete i program.",
      "Ta fram datorns modell och ungefärlig ålder om du känner till den.",
    ],
    escalation:
      "Be om hjälp om datorn fortfarande är seg, blir ovanligt varm, låter konstigt eller används i arbetet.",
    question: "När märks problemet mest?",
    options: [
      {
        id: "slow-start",
        label: "Vid start",
        reply: "Skriv hur lång starten brukar ta och om den nyligen blivit sämre.",
      },
      {
        id: "slow-browser",
        label: "I webbläsaren",
        reply: "Notera vilken webbläsare som används och om problemet gäller vissa webbsidor.",
      },
      {
        id: "slow-always",
        label: "Hela tiden",
        reply: "Det är ett bra läge att låta Nova IT kontrollera lagring, minne och diskhälsa.",
      },
      {
        id: "slow-hot",
        label: "Den blir varm",
        reply: "Skriv om datorn blir varm, låter mycket eller stänger av sig själv.",
      },
    ],
    serviceSlug: "felsokning",
  },
  {
    id: "wifi",
    label: "Wi-Fi och nätverk",
    title: "Wi-Fi och nätverk",
    keywords: ["wifi", "wi-fi", "internet", "nätverk", "router", "vpn", "uppkoppling"],
    intro: "Nätverksproblem behöver ringas in efter plats, antal enheter och hur ofta det händer.",
    firstSteps: [
      "Skriv om problemet gäller en enhet, flera enheter eller hela lokalen.",
      "Notera var uppkopplingen fungerar sämst och när avbrotten händer.",
      "Skriv om problemet påverkar möten, betalning, arbete eller flera användare.",
    ],
    escalation:
      "Gå vidare om flera enheter påverkas, anslutningen faller ofta eller nätet används för arbete.",
    question: "Vad beskriver problemet bäst?",
    options: [
      {
        id: "wifi-hidden",
        label: "Inget nät syns",
        reply: "Notera om nätet saknas på alla enheter eller bara på en specifik dator/mobil.",
      },
      {
        id: "wifi-drop",
        label: "Tappar anslutning",
        reply: "Skriv var avbrotten sker och om de påverkar samtal eller möten.",
      },
      {
        id: "wifi-slow",
        label: "Det är långsamt",
        reply: "Notera om det är långsamt överallt eller bara i vissa rum.",
      },
      {
        id: "wifi-one",
        label: "Bara en enhet",
        reply: "Skriv vilken enhet det gäller och om andra enheter fungerar normalt.",
      },
    ],
    serviceSlug: "natverk",
  },
  {
    id: "windows",
    label: "Windowsproblem",
    title: "Windowsproblem",
    keywords: [
      "windows",
      "uppdatering",
      "felkod",
      "blå skärm",
      "svart skärm",
      "skärmen är svart",
      "startar inte",
      "drivrutin",
    ],
    intro: "Ett exakt felmeddelande och vad som hände precis innan gör supporten säkrare.",
    firstSteps: [
      "Skriv av felkoden eller ta en bild.",
      "Notera om felet började efter en uppdatering.",
      "Skriv om filer, program eller inloggning påverkas.",
    ],
    escalation:
      "Be om hjälp om Windows inte startar, blå skärm återkommer eller filer riskerar att påverkas.",
    question: "Vilken felbild ser du?",
    options: [
      {
        id: "win-update",
        label: "Uppdatering fastnar",
        reply: "Notera procent, tid och om datorn behövs akut i arbete.",
      },
      {
        id: "win-code",
        label: "Felkod visas",
        reply: "Spara felkoden ordagrant; den styr vilka kontroller som är relevanta.",
      },
      {
        id: "win-start",
        label: "Startar inte",
        reply: "Låt datorn vara inkopplad och undvik upprepade hårda avstängningar.",
      },
      {
        id: "win-blue",
        label: "Blå skärm",
        reply: "Ta bild på stoppkoden. Orsaken kan vara drivrutin, minne, disk eller uppdatering.",
      },
    ],
    serviceSlug: "it-support",
  },
  {
    id: "upgrade",
    label: "Uppgradera dator",
    title: "Uppgradering av dator",
    keywords: ["uppgradera", "ssd", "ram", "minne", "batteri", "köpråd"],
    intro: "Kompatibilitet och ekonomi bör kontrolleras innan delar köps.",
    firstSteps: [
      "Ta fram modell och ungefärlig ålder.",
      "Bestäm om problemet är hastighet, lagring eller batteri.",
      "Notera vilka filer och program som behöver följa med vid service.",
    ],
    escalation: "Be om råd om modellen är okänd, svår att öppna eller data behöver flyttas.",
    question: "Vad vill du förbättra?",
    options: [
      {
        id: "up-ssd",
        label: "Snabbare lagring",
        reply:
          "Nova IT kan bedöma om SSD, minne eller en annan åtgärd ger bäst effekt för modellen.",
      },
      {
        id: "up-ram",
        label: "Mer minne",
        reply: "RAM hjälper vid många program, men alla modeller kan inte uppgraderas.",
      },
      {
        id: "up-battery",
        label: "Batteri",
        reply: "Batteribyte beror på modell, ålder och reservdelstillgång.",
      },
      {
        id: "up-advice",
        label: "Köpråd",
        reply: "Samla budget, användning, skärmstorlek och programkrav.",
      },
    ],
    serviceSlug: "datorinstallation",
  },
  {
    id: "virus",
    label: "Virus eller intrång",
    title: "Virus eller skadlig aktivitet",
    keywords: [
      "virus",
      "malware",
      "hack",
      "phishing",
      "misstänkt mejl",
      "misstänkt mail",
      "klickat på länk",
      "okänd länk",
      "popup",
      "kapat",
      "kapad",
      "intrång",
      "ransom",
      "krypterade filer",
      "betalningskrav",
      "bedrägeri",
    ],
    intro: "Vid misstänkt intrång är det viktigaste att minska risken och få hjälp snabbt.",
    firstSteps: [
      "Skriv vad som hänt: länk, popup, fil, konto eller betalningskrav.",
      "Spara felmeddelanden och skärmbilder.",
      "Kontakta Nova IT snabbt om konto, filer eller flera enheter kan vara påverkade.",
    ],
    escalation: "Sök hjälp direkt vid krypterade filer, betalningskrav eller kapade konton.",
    question: "Vad har du märkt?",
    options: [
      {
        id: "virus-popup",
        label: "Konstiga popups",
        reply: "Beskriv popupen och ta gärna en skärmbild innan du gör fler ändringar.",
      },
      {
        id: "virus-link",
        label: "Klickat på länk",
        reply: "Skriv vilken tjänst länken gällde och om inloggning eller betalning skedde.",
      },
      {
        id: "virus-files",
        label: "Filer är ändrade",
        reply:
          "Kontakta Nova IT direkt och beskriv vilka filer som ändrats samt när det upptäcktes.",
      },
      {
        id: "virus-account",
        label: "Konto kan vara kapat",
        reply:
          "Kontakta Nova IT direkt och beskriv vilken tjänst det gäller, när det upptäcktes och om inloggning eller betalning berörs.",
      },
    ],
    serviceSlug: "sakerhet-backup",
  },
  {
    id: "printer",
    label: "Skrivaren strular",
    title: "Skrivarproblem",
    keywords: ["skrivare", "utskrift", "offline", "toner", "bläck", "scanner", "skanner"],
    intro: "Vanliga orsaker är anslutning, utskriftskö, drivrutin eller förbrukningsmaterial.",
    firstSteps: [
      "Skriv skrivarmodell och om den är USB, nätverk eller Wi-Fi.",
      "Notera felmeddelande, om den är offline och om fler användare påverkas.",
      "Skriv om problemet gäller utskrift, skanning eller kvalitet.",
    ],
    escalation: "Be om hjälp om skrivaren används av flera eller fortsätter vara offline.",
    question: "Vad händer?",
    options: [
      {
        id: "print-offline",
        label: "Offline",
        reply: "Nova IT behöver veta anslutningstyp, placering och om fler datorer påverkas.",
      },
      {
        id: "print-queue",
        label: "Jobb fastnar",
        reply:
          "Nova IT behöver skrivarmodell, anslutningstyp, felmeddelande och om fler användare påverkas.",
      },
      {
        id: "print-quality",
        label: "Dålig kvalitet",
        reply:
          "Beskriv utskriftsfelet och vilken typ av dokument, papper och förbrukningsmaterial som används.",
      },
      {
        id: "print-add",
        label: "Lägga till skrivare",
        reply: "Samla modellnamn, anslutningstyp och vilken dator som ska användas.",
      },
    ],
    serviceSlug: "it-support",
  },
  {
    id: "account",
    label: "E-post och konto",
    title: "E-post, konto och inloggning",
    keywords: [
      "e-post",
      "mail",
      "mejl",
      "konto",
      "inlogg",
      "inloggning",
      "logga in",
      "lösenord",
      "mfa",
      "outlook",
      "gmail",
      "teams",
    ],
    intro: "Kontoproblem ska hanteras säkert, särskilt när e-post eller kunddata berörs.",
    firstSteps: [
      "Skriv vilken tjänst det gäller: Microsoft 365, Google, e-post eller annat konto.",
      "Notera om kontot är låst, lösenordet glömt eller MFA inte fungerar.",
      "Skriv om problemet påverkar en person eller flera.",
    ],
    escalation: "Sök hjälp om kontot är låst, MFA saknas eller e-post verkar kapad.",
    question: "Vad gäller kontot?",
    options: [
      {
        id: "account-password",
        label: "Glömt lösenord",
        reply: "Nova IT behöver veta tjänst, konto och om återställningsvägar finns kvar.",
      },
      {
        id: "account-mfa",
        label: "MFA fungerar inte",
        reply: "Ny telefon, fel tid eller borttagen app kan kräva säker återaktivering.",
      },
      {
        id: "account-locked",
        label: "Kontot är låst",
        reply:
          "Nova IT behöver veta tjänst, konto och om felet påverkar fler användare eller bara en person.",
      },
      {
        id: "account-mail",
        label: "E-post fungerar inte",
        reply: "Notera app, felmeddelande och om webbinloggning fungerar.",
      },
    ],
    serviceSlug: "microsoft-google",
  },
  {
    id: "backup",
    label: "Backup och filer",
    title: "Backup och filåterställning",
    keywords: ["backup", "säkerhetskopia", "återställa", "fil", "onedrive", "raderad"],
    intro: "Backup och återställning bör hanteras försiktigt så att data inte skrivs över.",
    firstSteps: [
      "Skriv vilka filer eller mappar som är viktigast.",
      "Notera var filerna brukar ligga: dator, OneDrive, Google Drive, extern disk eller server.",
      "Kontakta Nova IT innan du gör större återställningar om filerna är viktiga.",
    ],
    escalation:
      "Sök hjälp om filerna är kritiska, disken låter konstigt eller backupstatus är oklar.",
    question: "Vad behöver du göra?",
    options: [
      {
        id: "backup-start",
        label: "Komma igång",
        reply: "Lista viktiga mappar, e-post, bokföring och licensfiler.",
      },
      {
        id: "backup-check",
        label: "Backupstatus",
        reply: "Nova IT behöver veta var backupen finns och när den senast fungerade.",
      },
      {
        id: "backup-restore",
        label: "Återställa filer",
        reply: "Notera filnamn, plats och när filen senast var korrekt.",
      },
      {
        id: "backup-move",
        label: "Flytta till ny dator",
        reply: "Planera filer, e-post, bokmärken, skrivare och licenser före byte.",
      },
    ],
    serviceSlug: "sakerhet-backup",
  },
  {
    id: "refurbished",
    label: "Begagnad dator",
    title: "Begagnad eller refurbished dator",
    keywords: ["begagnad", "refurbished", "rekonditionerad", "köpa dator", "renoverad"],
    intro: "Skick, garanti, batteri, lagring och uppdateringsstöd bör kontrolleras före köp.",
    firstSteps: [
      "Skriv modell, budget och vad datorn ska användas till.",
      "Notera krav på program, skärmstorlek, batteri och lagring.",
      "Låt Nova IT bedöma om köp, uppgradering eller annan lösning är rimlig.",
    ],
    escalation: "Be om kontroll om datorn ska användas i arbete eller priset verkar avvikande.",
    question: "Vad vill du ha hjälp med?",
    options: [
      {
        id: "ref-buy",
        label: "Köpråd",
        reply: "Jämför modell och skick mot budget, programkrav och användning.",
      },
      {
        id: "ref-setup",
        label: "Ställa in",
        reply:
          "Nova IT behöver modell, användning och vilka konton, program och filer som ska finnas på datorn.",
      },
      {
        id: "ref-check",
        label: "Bedöma skick",
        reply: "Nova IT kan kontrollera batteri, SSD, skärm, portar, Wi-Fi och fläktljud.",
      },
      {
        id: "ref-transfer",
        label: "Flytta data",
        reply: "Planera filer, e-post, bokmärken, skrivare och licenser.",
      },
    ],
    serviceSlug: "datorinstallation",
  },
  {
    id: "installation",
    label: "Installation",
    title: "Installation och konfiguration",
    keywords: ["installera", "installation", "program", "ny dator", "konfigurera"],
    intro: "Data, konton, licenser och kringutrustning bör planeras innan installationen börjar.",
    firstSteps: [
      "Skriv vilken enhet och vilket system eller program det gäller.",
      "Ta fram licenser, konton och eventuella installationsuppgifter.",
      "Notera vilka filer, program och inställningar som behöver bevaras vid större ändringar.",
    ],
    escalation:
      "Be om hjälp när installationen påverkar filer, licenser, e-post eller flera användare.",
    question: "Vad ska installeras?",
    options: [
      {
        id: "install-win",
        label: "Windows",
        reply: "Samla modell, licensläge och besked om vilka filer som ska sparas.",
      },
      {
        id: "install-printer",
        label: "Skrivare",
        reply: "Samla modell, anslutningstyp och dator som ska använda den.",
      },
      {
        id: "install-other",
        label: "Annan installation",
        reply: "Skriv vad som ska installeras och på vilken enhet.",
      },
      {
        id: "install-app",
        label: "E-post eller program",
        reply: "Nova IT behöver konto, MFA-läge, licens och vilken app som ska användas.",
      },
    ],
    serviceSlug: "datorinstallation",
  },
  {
    id: "booking",
    label: "Förbered support",
    title: "Förbered ett supportärende",
    keywords: ["boka", "support", "hjälp", "tid", "fjärrhjälp", "service", "kontakt"],
    intro: "Guiden hjälper dig samla ett tydligt underlag innan Nova IT kontaktas.",
    firstSteps: [
      "Beskriv problemet kort.",
      "Notera enhetens modell om du känner till den.",
      "Ange om det stoppar arbete eller kan planeras.",
    ],
    escalation: "Gå till kontaktformuläret om arbete står still eller ett konto är låst.",
    question: "Vilken hjälp passar bäst?",
    options: [
      {
        id: "book-remote",
        label: "Fjärrhjälp",
        reply: "Passar program, e-post, Windows och enklare felsökning.",
      },
      {
        id: "book-onsite",
        label: "På plats",
        reply: "Passar nätverk, flera datorer eller fysisk utrustning.",
      },
      {
        id: "book-service",
        label: "Service",
        reply: "Passar uppgradering, ominstallation, backup eller startproblem.",
      },
      {
        id: "book-advice",
        label: "Rådgivning",
        reply: "Passar inför köp, systemval, backup eller säkerhetsupplägg.",
      },
    ],
    serviceSlug: "it-support",
  },
  {
    id: "general",
    label: "Annat problem",
    title: "Annat IT-problem",
    keywords: ["annat", "övrigt", "vet inte", "problem", "fråga"],
    intro: "Samla enhet, önskat resultat och exakt felbild även när kategorin är oklar.",
    firstSteps: [
      "Skriv vilken enhet eller tjänst det gäller.",
      "Beskriv vad du försökte göra och vad som hände.",
      "Skriv av felmeddelandet ordagrant.",
    ],
    escalation: "Gå vidare om problemet påverkar arbete, filer, konto eller internet.",
    question: "Vad kan du lägga till?",
    options: [
      {
        id: "gen-device",
        label: "Enhet",
        reply: "Notera modell, operativsystem och om den används privat eller i arbete.",
      },
      {
        id: "gen-error",
        label: "Felmeddelande",
        reply: "Spara en skärmbild eller skriv av texten ordagrant.",
      },
      {
        id: "gen-urgent",
        label: "Det är akut",
        reply: "Beskriv vad som är blockerat och hur många som påverkas.",
      },
      {
        id: "gen-contact",
        label: "Gå vidare",
        reply: "Kontaktformuläret hjälper dig samla uppgifter så Nova IT kan återkomma rätt.",
      },
    ],
    serviceSlug: "it-support",
  },
];
