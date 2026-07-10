import type { SupportFlow } from "./support-types";

export const supportFlows: SupportFlow[] = [
  {
    id: "slow-computer",
    label: "Långsam dator",
    title: "Långsam dator",
    keywords: ["långsam", "seg", "trög", "hänger", "prestanda", "full disk"],
    intro:
      "Långsamhet beror ofta på full lagring, många autostartprogram, för lite minne eller en äldre disk.",
    firstSteps: [
      "Starta om och testa med bara ett viktigt program öppet.",
      "Kontrollera att minst 15 procent av lagringen är ledig.",
      "Notera om hela datorn eller bara ett program är långsamt.",
    ],
    escalation:
      "Be om hjälp om datorn fortfarande är seg, blir ovanligt varm, låter konstigt eller används i arbetet.",
    question: "När märks problemet mest?",
    options: [
      {
        id: "slow-start",
        label: "Vid start",
        reply: "Kontrollera autostart, uppdateringar och ledigt lagringsutrymme.",
      },
      {
        id: "slow-browser",
        label: "I webbläsaren",
        reply: "Testa färre flikar, inaktivera okända tillägg och jämför med en annan webbläsare.",
      },
      {
        id: "slow-always",
        label: "Hela tiden",
        reply: "Då bör lagring, minne, temperatur och diskhälsa kontrolleras metodiskt.",
      },
      {
        id: "slow-hot",
        label: "Den blir varm",
        reply: "Stäng av en stund, kontrollera fläktljud och undvik mjuka underlag.",
      },
    ],
    serviceSlug: "felsokning",
  },
  {
    id: "wifi",
    label: "Wi-Fi och nätverk",
    title: "Wi-Fi och nätverk",
    keywords: ["wifi", "wi-fi", "internet", "nätverk", "router", "vpn", "uppkoppling"],
    intro: "Skilj först på nätet, routern och den enhet som krånglar.",
    firstSteps: [
      "Testa om fler enheter har samma problem.",
      "Starta om router och berörd enhet.",
      "Testa nära routern och stäng tillfälligt av VPN.",
    ],
    escalation:
      "Gå vidare om flera enheter påverkas, anslutningen faller ofta eller nätet används för arbete.",
    question: "Vad beskriver problemet bäst?",
    options: [
      {
        id: "wifi-hidden",
        label: "Inget nät syns",
        reply: "Kontrollera flygplansläge, Wi-Fi-knapp och om routern visar normal drift.",
      },
      {
        id: "wifi-drop",
        label: "Tappar anslutning",
        reply: "Svag signal, störningar eller en drivrutin kan orsaka återkommande avbrott.",
      },
      {
        id: "wifi-slow",
        label: "Det är långsamt",
        reply: "Jämför nära routern och med kabel om möjligt för att avgränsa felet.",
      },
      {
        id: "wifi-one",
        label: "Bara en enhet",
        reply: "Fokusera på den enhetens sparade nätverk, uppdateringar och nätverksinställningar.",
      },
    ],
    serviceSlug: "natverk",
  },
  {
    id: "windows",
    label: "Windowsproblem",
    title: "Windowsproblem",
    keywords: ["windows", "uppdatering", "felkod", "blå skärm", "startar inte", "drivrutin"],
    intro: "Ett exakt felmeddelande och vad som hände precis innan gör felsökningen säkrare.",
    firstSteps: [
      "Skriv av felkoden eller ta en bild.",
      "Koppla ur onödiga USB-enheter och starta om.",
      "Notera om felet började efter en uppdatering.",
    ],
    escalation:
      "Be om hjälp om Windows inte startar, blå skärm återkommer eller filer riskerar att påverkas.",
    question: "Vilken felbild ser du?",
    options: [
      {
        id: "win-update",
        label: "Uppdatering fastnar",
        reply: "Notera procent och tid. Stäng inte av medan installationen fortfarande arbetar.",
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
    id: "chromeos-flex",
    label: "ChromeOS Flex",
    title: "ChromeOS Flex",
    keywords: ["chromeos", "chrome os", "flex", "chromebook", "usb-start"],
    intro: "Kompatibilitet och backup måste kontrolleras innan Windows ersätts.",
    firstSteps: [
      "Ta fram datorns exakta modell.",
      "Testa systemet från USB före installation.",
      "Kontrollera Wi-Fi, ljud, kamera och pekplatta i testläget.",
    ],
    escalation: "Be om hjälp före permanent installation eller om hårdvara saknas i testläget.",
    question: "Vad gäller frågan?",
    options: [
      {
        id: "flex-install",
        label: "Installera",
        reply: "Säkerhetskopiera först; permanent installation kan radera hela disken.",
      },
      {
        id: "flex-boot",
        label: "USB-start fungerar inte",
        reply: "Startmeny eller BIOS behöver väljas med rätt tangent för datormodellen.",
      },
      {
        id: "flex-wifi",
        label: "Wi-Fi saknas",
        reply: "Det kan tyda på ett inkompatibelt nätverkskort.",
      },
      {
        id: "flex-limits",
        label: "Begränsningar",
        reply: "ChromeOS Flex fokuserar på webbappar och har inte samma appstöd som en Chromebook.",
      },
    ],
    serviceSlug: "datorinstallation",
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
      "Säkerhetskopiera viktiga filer före service.",
    ],
    escalation: "Be om råd om modellen är okänd, svår att öppna eller data behöver flyttas.",
    question: "Vad vill du förbättra?",
    options: [
      {
        id: "up-ssd",
        label: "Snabbare lagring",
        reply: "En SSD ger ofta störst effekt på äldre datorer.",
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
    keywords: ["virus", "malware", "hack", "phishing", "popup", "kapat", "ransom", "bedrägeri"],
    intro: "Begränsa risken, spara bevis och undvik att klicka vidare.",
    firstSteps: [
      "Koppla bort internet om något pågår just nu.",
      "Byt lösenord från en annan säker enhet om ett konto kan vara påverkat.",
      "Spara felmeddelanden och skärmbilder.",
    ],
    escalation: "Sök hjälp direkt vid krypterade filer, betalningskrav eller kapade konton.",
    question: "Vad har du märkt?",
    options: [
      {
        id: "virus-popup",
        label: "Konstiga popups",
        reply: "Stäng sidan och kontrollera webbläsartillägg och notisbehörigheter.",
      },
      {
        id: "virus-link",
        label: "Klickat på länk",
        reply: "Byt berörda lösenord och aktivera flerfaktorsinloggning från säker enhet.",
      },
      {
        id: "virus-files",
        label: "Filer är ändrade",
        reply: "Sluta använda datorn; snabb isolering är viktigare än vanlig felsökning.",
      },
      {
        id: "virus-account",
        label: "Konto kan vara kapat",
        reply: "Logga ut aktiva sessioner och kontrollera MFA och e-postregler.",
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
      "Kontrollera papper, toner och skrivarens felmeddelande.",
      "Starta om skrivare och dator.",
      "Kontrollera standardskrivare och töm fastnade utskriftsjobb.",
    ],
    escalation: "Be om hjälp om skrivaren används av flera eller fortsätter vara offline.",
    question: "Vad händer?",
    options: [
      {
        id: "print-offline",
        label: "Offline",
        reply: "Kontrollera kabel/Wi-Fi och om skrivaren fått en ny nätverksadress.",
      },
      {
        id: "print-queue",
        label: "Jobb fastnar",
        reply: "Töm kön och prova en enkel testsida först.",
      },
      {
        id: "print-quality",
        label: "Dålig kvalitet",
        reply: "Kör skrivarens testsida och kontrollera toner, bläck och papperstyp.",
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
    keywords: ["e-post", "mail", "mejl", "konto", "inlogg", "lösenord", "mfa", "outlook", "gmail"],
    intro: "Kontoproblem ska hanteras säkert, särskilt när e-post eller kunddata berörs.",
    firstSteps: [
      "Kontrollera rätt konto, tangentbordslayout och Caps Lock.",
      "Använd tjänstens ordinarie återställningsflöde.",
      "Kontrollera MFA och aktiva sessioner om något verkar fel.",
    ],
    escalation: "Sök hjälp om kontot är låst, MFA saknas eller e-post verkar kapad.",
    question: "Vad gäller kontot?",
    options: [
      {
        id: "account-password",
        label: "Glömt lösenord",
        reply: "Kontrollera om du når tjänstens återställningsmejl eller andra återställningssätt.",
      },
      {
        id: "account-mfa",
        label: "MFA fungerar inte",
        reply: "Ny telefon, fel tid eller borttagen app kan kräva säker återaktivering.",
      },
      {
        id: "account-locked",
        label: "Kontot är låst",
        reply: "Undvik många nya försök och kontrollera appar med sparade gamla lösenord.",
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
    intro: "Återställning blir tryggast när kopians plats och senaste korrekta version är kända.",
    firstSteps: [
      "Sluta spara på samma plats om något raderats.",
      "Kontrollera papperskorg och molntjänstens versionshistorik.",
      "Återställ aldrig över den enda kvarvarande kopian.",
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
        label: "Kontrollera backup",
        reply: "En backup är inte verifierad förrän en återställning har testats.",
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
      "Kontrollera modell, processor, RAM, lagring och batterihälsa.",
      "Säkerställ giltig licens och säkerhetsuppdateringar.",
      "Kontrollera garanti och returvillkor.",
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
        reply: "Uppdatera system, rensa gamla konton och aktivera säkerhet och backup.",
      },
      {
        id: "ref-check",
        label: "Kontrollera skick",
        reply: "Kontrollera batteri, SSD, skärm, portar, Wi-Fi och fläktljud.",
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
      "Kontrollera att licenser och konton finns tillgängliga.",
      "Säkerhetskopiera före ominstallation eller större ändringar.",
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
        id: "install-flex",
        label: "ChromeOS Flex",
        reply: "Testa från USB och gör backup före permanent installation.",
      },
      {
        id: "install-app",
        label: "E-post eller program",
        reply: "Kontrollera konto, MFA, licens och vilken app som ska användas.",
      },
    ],
    serviceSlug: "datorinstallation",
  },
  {
    id: "booking",
    label: "Förbered support",
    title: "Förbered ett supportärende",
    keywords: ["boka", "support", "hjälp", "tid", "fjärrhjälp", "service", "kontakt"],
    intro: "Guiden kan samla ett tydligt underlag, men skickar inget i den här demon.",
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
        reply: "Kontaktformuläret kan förbereda ett ärende utan att något skickas i demon.",
      },
    ],
    serviceSlug: "it-support",
  },
];
