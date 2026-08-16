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

/**
 * Supportassistentens kunskapsbas.
 *
 * Varje flöde representerar en avgränsad ärendetyp som Nova IT faktiskt
 * hanterar (se `src/lib/nova-data.ts` för tjänstekatalogen som
 * `serviceSlug` pekar mot). `keywords` samlar medvetet många vardagliga
 * sätt att beskriva samma problem - stavfel, engelska låneord, korta
 * utrop - eftersom matchningen i `support-engine.ts` bara känner igen det
 * den faktiskt ser i texten. Bredd i ordlistan är det som gör förståelsen
 * bättre, inte fler flöden i sig.
 *
 * Texterna är skrivna som en erfaren tekniker skulle prata: konkret,
 * lugn och utan överord. Ingen text ska låta som en generisk chatbot -
 * varje rad ska kunna komma från någon som faktiskt gjort jobbet förut.
 */
export const supportFlows: SupportFlow[] = [
  {
    id: "slow-computer",
    label: "Långsam dator",
    title: "Långsam dator",
    keywords: [
      "långsam",
      "seg",
      "trög",
      "tregt",
      "hänger",
      "hänger sig",
      "fryser",
      "laggar",
      "laggig",
      "prestanda",
      "full disk",
      "disken är full",
      "för lite minne",
      "snurrar bara",
      "tar evigheter",
      "startar segt",
      "orkar inte",
    ],
    intro:
      "En långsam dator kan bero på lagring, minne, bakgrundsprogram eller ren ålder - det går sällan att säga innan vi vet var det märks mest och hur gammal maskinen är.",
    firstSteps: [
      "Notera om hela datorn eller bara ett enskilt program är långsamt.",
      "Skriv när problemet märks mest: start, webbläsare, möten eller arbete i program.",
      "Ta fram datorns modell och ungefärlig ålder om du känner till den.",
    ],
    escalation:
      "Be om hjälp om datorn fortfarande är seg efter omstart, blir ovanligt varm, låter konstigt eller används i arbetet dagligen.",
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
        reply:
          "Notera vilken webbläsare som används och om problemet gäller vissa flikar eller sidor.",
      },
      {
        id: "slow-always",
        label: "Hela tiden",
        reply:
          "Det är ett bra läge att låta Nova IT kontrollera lagring, minne och diskhälsa på plats eller via fjärrhjälp.",
      },
      {
        id: "slow-hot",
        label: "Den blir varm",
        reply:
          "Skriv om datorn blir varm, låter mycket eller stänger av sig själv - det pekar ofta mot kylning eller batteri, inte bara mjukvara.",
      },
    ],
    serviceSlug: "felsokning",
  },
  {
    id: "wifi",
    label: "Wi-Fi och nätverk",
    title: "Wi-Fi och nätverk",
    keywords: [
      "wifi",
      "wi-fi",
      "wi fi",
      "internet",
      "nätverk",
      "nätet",
      "uppkoppling",
      "uppkopplingen",
      "router",
      "routern",
      "modem",
      "vpn",
      "trådlöst",
      "trådlöst nät",
      "svagt nät",
      "dålig täckning",
      "ingen signal",
      "kommer inte ut på nätet",
      "tappar nätet",
      "surfar inte",
    ],
    intro:
      "Nätverksproblem behöver ringas in efter plats, antal enheter och hur ofta det händer - annars fixas fel del av kedjan.",
    firstSteps: [
      "Skriv om problemet gäller en enhet, flera enheter eller hela lokalen.",
      "Notera var uppkopplingen fungerar sämst och när avbrotten händer.",
      "Skriv om problemet påverkar möten, betalning, arbete eller flera användare.",
    ],
    escalation:
      "Gå vidare om flera enheter påverkas, anslutningen faller ofta eller nätet används för arbete eller betalningar.",
    question: "Vad beskriver problemet bäst?",
    options: [
      {
        id: "wifi-hidden",
        label: "Inget nät syns",
        reply:
          "Notera om nätet saknas på alla enheter eller bara på en specifik dator eller mobil.",
      },
      {
        id: "wifi-drop",
        label: "Tappar anslutning",
        reply: "Skriv var avbrotten sker och om de påverkar samtal eller möten.",
      },
      {
        id: "wifi-slow",
        label: "Det är långsamt",
        reply:
          "Notera om det är långsamt överallt eller bara i vissa rum - avstånd till routern är ofta boven.",
      },
      {
        id: "wifi-one",
        label: "Bara en enhet",
        reply: "Skriv vilken enhet det gäller och om andra enheter fungerar normalt på samma nät.",
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
      "uppdaterar",
      "felkod",
      "blå skärm",
      "blue screen",
      "svart skärm",
      "skärmen är svart",
      "startar inte",
      "startar om själv",
      "startar om av sig själv",
      "kraschar",
      "krashar",
      "drivrutin",
      "windows update",
      "fastnar på uppdatering",
    ],
    intro:
      "Ett exakt felmeddelande och vad som hände precis innan gör supporten mycket säkrare - gissningar utan felkod kostar tid.",
    firstSteps: [
      "Skriv av felkoden ordagrant eller ta en bild av skärmen.",
      "Notera om felet började efter en uppdatering eller installation.",
      "Skriv om filer, program eller inloggning påverkas.",
    ],
    escalation:
      "Be om hjälp om Windows inte startar, blå skärm återkommer eller filer riskerar att påverkas.",
    question: "Vilken felbild ser du?",
    options: [
      {
        id: "win-update",
        label: "Uppdatering fastnar",
        reply:
          "Notera hur länge den stått still, ungefärlig procent och om datorn behövs akut i arbete.",
      },
      {
        id: "win-code",
        label: "Felkod visas",
        reply: "Spara felkoden ordagrant - den styr vilka kontroller som faktiskt är relevanta.",
      },
      {
        id: "win-start",
        label: "Startar inte",
        reply:
          "Låt datorn vara inkopplad och undvik upprepade hårda avstängningar tills Nova IT tittat på den.",
      },
      {
        id: "win-blue",
        label: "Blå skärm",
        reply:
          "Ta bild på stoppkoden om den hinner synas. Orsaken kan vara drivrutin, minne, disk eller en uppdatering.",
      },
    ],
    serviceSlug: "it-support",
  },
  {
    id: "screen",
    label: "Skärm och bild",
    title: "Skärm- och bildproblem",
    keywords: [
      "skärm",
      "bildskärm",
      "monitor",
      "ingen bild",
      "svart skärm",
      "flimrar",
      "flimmer",
      "fläckar på skärmen",
      "trasig skärm",
      "spräckt skärm",
      "extern skärm",
      "andra skärmen",
      "projektor",
      "hdmi",
      "upplösning",
      "fel upplösning",
    ],
    intro:
      "Skärmproblem kan sitta i kabeln, kortet, inställningen eller själva panelen - vilket avgör om det går att laga, koppla om eller behöver bytas.",
    firstSteps: [
      "Skriv om det gäller den inbyggda skärmen, en extern skärm eller en projektor.",
      "Notera om det är helt svart, flimrar, har fel färger eller bara fel upplösning.",
      "Skriv vilken kabel eller anslutning som används, om du vet det (HDMI, USB-C, DisplayPort).",
    ],
    escalation:
      "Be om hjälp om skärmen är helt svart trots att datorn verkar vara igång, eller om problemet uppstod efter en fysisk skada.",
    question: "Vad stämmer bäst?",
    options: [
      {
        id: "screen-black",
        label: "Helt svart",
        reply:
          "Notera om datorn låter igång (fläkt, lampor) trots att skärmen är svart - det avgör om felet sitter i skärmen eller datorn.",
      },
      {
        id: "screen-flicker",
        label: "Flimrar eller blinkar",
        reply:
          "Skriv om det händer hela tiden eller bara i vissa lägen, till exempel vid rörelse eller mörk bakgrund.",
      },
      {
        id: "screen-external",
        label: "Extern skärm funkar inte",
        reply: "Notera vilken kabeltyp och om skärmen fungerar mot en annan dator.",
      },
      {
        id: "screen-damaged",
        label: "Synlig skada",
        reply:
          "Beskriv skadan och när den uppstod. Fysisk skada går sällan att felsöka på distans.",
      },
    ],
    serviceSlug: "felsokning",
  },
  {
    id: "video-meeting",
    label: "Videomöten och ljud",
    title: "Videomöten, kamera och ljud",
    keywords: [
      "teams",
      "zoom",
      "google meet",
      "videomöte",
      "video möte",
      "kamera",
      "webbkamera",
      "mikrofon",
      "mikron",
      "hörs inte",
      "syns inte",
      "ljudet fungerar inte",
      "delar skärm",
      "skärmdelning",
      "möte krånglar",
      "hörlurar",
      "headset",
    ],
    intro:
      "Kamera- och mikrofonproblem inför möten är ofta en behörighets- eller enhetsinställning, men kan också vara drivrutin eller mjukvara som krockar.",
    firstSteps: [
      "Skriv vilket mötesverktyg det gäller: Teams, Zoom, Google Meet eller annat.",
      "Notera om problemet är kameran, mikrofonen, ljudet eller skärmdelningen.",
      "Skriv om det fungerade tidigare och vad som ändrades innan det slutade fungera.",
    ],
    escalation:
      "Be om hjälp i god tid före ett viktigt möte, inte akut när mötet redan börjat - felsökning tar oftast några minuter.",
    question: "Vad är problemet?",
    options: [
      {
        id: "video-camera",
        label: "Kameran syns inte",
        reply:
          "Notera vilket program som ska använda kameran och om andra program (till exempel Kamera-appen) ser den.",
      },
      {
        id: "video-mic",
        label: "Mikrofonen hörs inte",
        reply:
          "Skriv om det gäller en inbyggd mikrofon eller ett headset, och om ljudnivån syns röra sig i mötesverktygets inställningar.",
      },
      {
        id: "video-share",
        label: "Skärmdelning fungerar inte",
        reply:
          "Notera felmeddelandet och om det gäller att dela hela skärmen eller ett enskilt fönster.",
      },
      {
        id: "video-permission",
        label: "Behörighet nekas",
        reply:
          "Windows eller macOS kan blockera kamera/mikrofon på systemnivå - notera vilket operativsystem det gäller.",
      },
    ],
    serviceSlug: "microsoft-google",
  },
  {
    id: "printer",
    label: "Skrivaren strular",
    title: "Skrivarproblem",
    keywords: [
      "skrivare",
      "skrivaren",
      "utskrift",
      "skriver inte ut",
      "offline",
      "toner",
      "bläck",
      "scanner",
      "skanner",
      "scanning",
      "skanning",
      "papper fastnar",
      "papperskrångel",
      "kö med utskrifter",
      "utskriftskö",
    ],
    intro:
      "Vanliga orsaker till skrivarproblem är anslutning, utskriftskö, drivrutin eller förbrukningsmaterial - sällan skrivaren själv.",
    firstSteps: [
      "Skriv skrivarmodell och om den är ansluten via USB, nätverkskabel eller Wi-Fi.",
      "Notera felmeddelande, om den är offline och om fler användare påverkas.",
      "Skriv om problemet gäller utskrift, skanning eller kvalitet.",
    ],
    escalation:
      "Be om hjälp om skrivaren används av flera eller fortsätter vara offline efter omstart.",
    question: "Vad händer?",
    options: [
      {
        id: "print-offline",
        label: "Offline",
        reply:
          "Nova IT behöver veta anslutningstyp, placering och om fler datorer påverkas av samma skrivare.",
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
          "Beskriv utskriftsfelet (ränder, blek text, fel färg) och vilken typ av papper och förbrukningsmaterial som används.",
      },
      {
        id: "print-add",
        label: "Lägga till skrivare",
        reply:
          "Samla modellnamn, anslutningstyp och vilken eller vilka datorer som ska använda den.",
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
      "epost",
      "mail",
      "mejl",
      "konto",
      "kontot",
      "inlogg",
      "inloggning",
      "logga in",
      "kommer inte in",
      "lösenord",
      "glömt lösenord",
      "återställa lösenord",
      "mfa",
      "tvåfaktor",
      "authenticator",
      "outlook",
      "gmail",
      "teams",
      "icloud",
      "apple id",
    ],
    intro:
      "Kontoproblem ska hanteras säkert, särskilt när e-post, betalningar eller kunddata kan vara berörda.",
    firstSteps: [
      "Skriv vilken tjänst det gäller: Microsoft 365, Google, e-post eller annat konto.",
      "Notera om kontot är låst, lösenordet glömt eller MFA (tvåfaktor) inte fungerar.",
      "Skriv om problemet påverkar en person eller flera i samma verksamhet.",
    ],
    escalation:
      "Sök hjälp direkt om kontot är låst, MFA saknas eller e-posten verkar ha använts av någon annan.",
    question: "Vad gäller kontot?",
    options: [
      {
        id: "account-password",
        label: "Glömt lösenord",
        reply:
          "Nova IT behöver veta tjänst, konto och om återställningsvägar (telefon, reservmejl) fortfarande finns kvar.",
      },
      {
        id: "account-mfa",
        label: "MFA fungerar inte",
        reply:
          "Ny telefon, fel tid på enheten eller borttagen app kräver ofta en säker återaktivering, inte bara ett nytt lösenord.",
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
        reply:
          "Notera vilken app eller webbinloggning som används, felmeddelandet och om andra tjänster fungerar.",
      },
    ],
    serviceSlug: "microsoft-google",
  },
  {
    id: "virus",
    label: "Virus eller intrång",
    title: "Virus eller skadlig aktivitet",
    keywords: [
      "virus",
      "malware",
      "skadlig kod",
      "hack",
      "hackad",
      "phishing",
      "nätfiske",
      "misstänkt mejl",
      "misstänkt mail",
      "misstänkt sms",
      "klickat på länk",
      "okänd länk",
      "popup",
      "reklamfönster",
      "kapat",
      "kapad",
      "intrång",
      "ransom",
      "ransomware",
      "krypterade filer",
      "betalningskrav",
      "bedrägeri",
      "blivit lurad",
      "gav ut mina uppgifter",
    ],
    intro:
      "Vid misstänkt intrång är det viktigaste att minska risken snabbt, inte att felsöka i detalj själv.",
    firstSteps: [
      "Skriv vad som hänt: en länk, en popup, en fil, ett konto eller ett betalningskrav.",
      "Spara felmeddelanden och ta skärmbilder innan du gör fler ändringar.",
      "Kontakta Nova IT snabbt om ett konto, filer eller flera enheter kan vara påverkade.",
    ],
    escalation:
      "Sök hjälp direkt vid krypterade filer, betalningskrav eller konton som kan vara kapade.",
    question: "Vad har du märkt?",
    options: [
      {
        id: "virus-popup",
        label: "Konstiga popups",
        reply:
          "Beskriv popupen och ta gärna en skärmbild innan du klickar bort den eller gör fler ändringar.",
      },
      {
        id: "virus-link",
        label: "Klickat på länk",
        reply:
          "Skriv vilken tjänst länken påstod sig gälla, och om någon inloggning eller betalning hann ske.",
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
    id: "backup",
    label: "Backup och filer",
    title: "Backup och filåterställning",
    keywords: [
      "backup",
      "säkerhetskopia",
      "säkerhetskopiera",
      "återställa",
      "återställ fil",
      "fil",
      "mapp försvunnen",
      "onedrive",
      "google drive",
      "dropbox",
      "icloud",
      "raderad",
      "raderat av misstag",
      "borttagen fil",
      "synkar inte",
      "synkroniserar inte",
    ],
    intro:
      "Backup och återställning bör hanteras försiktigt så att data inte skrivs över innan vi vet var filerna faktiskt ligger.",
    firstSteps: [
      "Skriv vilka filer eller mappar som är viktigast.",
      "Notera var filerna brukar ligga: dator, OneDrive, Google Drive, extern disk eller server.",
      "Kontakta Nova IT innan du gör större återställningar om filerna är viktiga - vissa åtgärder går inte att ångra.",
    ],
    escalation:
      "Sök hjälp om filerna är kritiska, disken låter konstigt eller backupstatus är oklar.",
    question: "Vad behöver du göra?",
    options: [
      {
        id: "backup-start",
        label: "Komma igång",
        reply: "Lista viktiga mappar, e-post, bokföring och licensfiler som bör ingå från början.",
      },
      {
        id: "backup-check",
        label: "Backupstatus",
        reply: "Nova IT behöver veta var backupen finns idag och när den senast faktiskt kördes.",
      },
      {
        id: "backup-restore",
        label: "Återställa filer",
        reply:
          "Notera filnamn, plats och när filen senast var korrekt - sluta använda enheten om möjligt tills dess.",
      },
      {
        id: "backup-move",
        label: "Flytta till ny dator",
        reply: "Planera filer, e-post, bokmärken, skrivare och licenser innan bytet, inte efteråt.",
      },
    ],
    serviceSlug: "sakerhet-backup",
  },
  {
    id: "external-storage",
    label: "Extern lagring och USB",
    title: "Extern hårddisk, USB och minneskort",
    keywords: [
      "extern hårddisk",
      "extern disk",
      "usb",
      "usb-minne",
      "minneskort",
      "sd-kort",
      "känns inte igen",
      "syns inte i utforskaren",
      "hittar inte disken",
      "disken låter konstigt",
      "klickande ljud",
      "filer försvunna",
      "korrupt fil",
      "går inte att öppna filen",
    ],
    intro:
      "En extern disk eller ett USB-minne som slutat synas kan bero på kabeln, porten, filsystemet eller själva disken - ordningen på felsökningen spelar roll för att inte förlora data.",
    firstSteps: [
      "Notera om disken innehåller viktiga filer som inte finns någon annanstans - sluta i så fall använda den.",
      "Skriv om disken syns i Utforskaren eller Finder, i Diskhantering, eller inte alls.",
      "Notera om disken låter konstigt (klickande, tickande) - då är fysisk skada trolig.",
    ],
    escalation:
      "Kontakta Nova IT direkt om disken låter konstigt eller innehåller filer som inte finns i någon backup - fortsatt användning kan göra återställning svårare.",
    question: "Vad stämmer bäst?",
    options: [
      {
        id: "storage-not-detected",
        label: "Syns inte alls",
        reply:
          "Testa gärna en annan port eller dator om du kan göra det utan risk, och skriv vad som hände.",
      },
      {
        id: "storage-noise",
        label: "Låter konstigt",
        reply:
          "Sluta använda disken nu. Ovanliga ljud kan betyda att mekaniken är på väg att haverera.",
      },
      {
        id: "storage-corrupt",
        label: "Filer går inte att öppna",
        reply:
          "Notera filtyp och felmeddelande. Rör inte filerna mer än nödvändigt innan Nova IT tittat på det.",
      },
      {
        id: "storage-missing",
        label: "Filer är försvunna",
        reply:
          "Skriv när du senast såg filerna och om något annat ändrades samtidigt, till exempel en synk eller ominstallation.",
      },
    ],
    serviceSlug: "sakerhet-backup",
  },
  {
    id: "upgrade",
    label: "Uppgradera dator",
    title: "Uppgradering av dator",
    keywords: [
      "uppgradera",
      "uppgradering",
      "ssd",
      "byta ssd",
      "ram",
      "mer minne",
      "minne",
      "batteri",
      "batteribyte",
      "dåligt batteri",
      "köpråd",
      "snabbare dator",
      "göra datorn snabbare",
    ],
    intro:
      "Kompatibilitet och ekonomi bör kontrolleras innan delar köps - inte alla modeller går att uppgradera, och ibland är en ny dator billigare i längden.",
    firstSteps: [
      "Ta fram modell och ungefärlig ålder.",
      "Bestäm om problemet är hastighet, lagring eller batteri.",
      "Notera vilka filer och program som behöver följa med vid en eventuell service.",
    ],
    escalation:
      "Be om råd om modellen är okänd, svår att öppna, eller om data behöver flyttas i samband med bytet.",
    question: "Vad vill du förbättra?",
    options: [
      {
        id: "up-ssd",
        label: "Snabbare lagring",
        reply:
          "Nova IT kan bedöma om SSD, minne eller en annan åtgärd ger bäst effekt för just den modellen.",
      },
      {
        id: "up-ram",
        label: "Mer minne",
        reply:
          "Mer RAM hjälper vid många program samtidigt, men alla modeller går inte att uppgradera - värt att kontrollera först.",
      },
      {
        id: "up-battery",
        label: "Batteri",
        reply: "Batteribyte beror på modell, ålder och om reservdelar finns tillgängliga.",
      },
      {
        id: "up-advice",
        label: "Köpråd",
        reply: "Samla budget, användning, skärmstorlek och programkrav innan ni bestämmer er.",
      },
    ],
    serviceSlug: "datorservice",
  },
  {
    id: "cleaning-service",
    label: "Genomgång och rengöring",
    title: "Genomgång, rengöring och allmän service",
    keywords: [
      "rengöring",
      "rengöra",
      "dammig",
      "damm",
      "fläkten låter",
      "surrar",
      "brummar",
      "luktar bränt",
      "genomgång",
      "hälsokontroll",
      "service på datorn",
      "underhåll",
      "stänger av sig",
      "överhettar",
      "blir jättevarm",
    ],
    intro:
      "Damm och slitna fläktar är en av de vanligaste orsakerna till att äldre datorer blir varma, högljudda eller oförklarligt långsamma - en genomgång är ofta billigare än den känns.",
    firstSteps: [
      "Skriv hur gammal datorn är och om den används dagligen.",
      "Notera om den blir varm, låter mer än vanligt eller stänger av sig själv.",
      "Skriv om det är en bärbar eller stationär dator.",
    ],
    escalation:
      "Be om hjälp snarast om datorn stänger av sig själv vid belastning eller luktar bränt - det är inte bara ett skönhetsfel.",
    question: "Vad märker du mest?",
    options: [
      {
        id: "clean-loud",
        label: "Låter mer än vanligt",
        reply:
          "Notera om ljudet ökar när datorn jobbar hårt (till exempel videosamtal) eller är konstant.",
      },
      {
        id: "clean-hot",
        label: "Blir väldigt varm",
        reply: "Skriv var det känns varmast och om det påverkar hur datorn presterar.",
      },
      {
        id: "clean-shutdown",
        label: "Stänger av sig själv",
        reply:
          "Notera när det händer - ofta vid tung belastning som spel, videoredigering eller flera program samtidigt.",
      },
      {
        id: "clean-routine",
        label: "Bara en rutinkoll",
        reply:
          "Bra läge för en genomgång innan något faktiskt går sönder, särskilt på en dator äldre än ett par år.",
      },
    ],
    serviceSlug: "datorservice",
  },
  {
    id: "refurbished",
    label: "Begagnad dator",
    title: "Begagnad eller refurbished dator",
    keywords: [
      "begagnad",
      "refurbished",
      "rekonditionerad",
      "köpa dator",
      "ny dator",
      "renoverad",
      "andrahandsdator",
    ],
    intro:
      "Skick, garanti, batteri, lagring och uppdateringsstöd bör kontrolleras före köp - särskilt vid begagnat.",
    firstSteps: [
      "Skriv modell, budget och vad datorn ska användas till.",
      "Notera krav på program, skärmstorlek, batteri och lagring.",
      "Låt Nova IT bedöma om köp, uppgradering eller annan lösning är rimlig i ditt fall.",
    ],
    escalation:
      "Be om kontroll om datorn ska användas i arbete eller om priset verkar avvikande från marknaden.",
    question: "Vad vill du ha hjälp med?",
    options: [
      {
        id: "ref-buy",
        label: "Köpråd",
        reply: "Jämför modell och skick mot budget, programkrav och faktisk användning.",
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
        reply:
          "Nova IT kan kontrollera batteri, SSD, skärm, portar, Wi-Fi och fläktljud innan köp eller efter leverans.",
      },
      {
        id: "ref-transfer",
        label: "Flytta data",
        reply:
          "Planera filer, e-post, bokmärken, skrivare och licenser innan den gamla datorn tas ur bruk.",
      },
    ],
    serviceSlug: "datorinstallation",
  },
  {
    id: "installation",
    label: "Installation",
    title: "Installation och konfiguration",
    keywords: [
      "installera",
      "installation",
      "program",
      "ny dator",
      "konfigurera",
      "konfiguration",
      "ställa in ny dator",
      "sätta upp",
    ],
    intro:
      "Data, konton, licenser och kringutrustning bör planeras innan installationen börjar, inte upptäckas efteråt.",
    firstSteps: [
      "Skriv vilken enhet och vilket system eller program det gäller.",
      "Ta fram licenser, konton och eventuella installationsuppgifter.",
      "Notera vilka filer, program och inställningar som behöver bevaras vid större ändringar.",
    ],
    escalation:
      "Be om hjälp när installationen påverkar filer, licenser, e-post eller flera användare samtidigt.",
    question: "Vad ska installeras?",
    options: [
      {
        id: "install-win",
        label: "Windows",
        reply:
          "Samla modell, licensläge och besked om vilka filer som ska sparas innan installationen.",
      },
      {
        id: "install-printer",
        label: "Skrivare",
        reply: "Samla modell, anslutningstyp och vilken dator som ska använda den.",
      },
      {
        id: "install-other",
        label: "Annan installation",
        reply: "Skriv vad som ska installeras och på vilken enhet.",
      },
      {
        id: "install-app",
        label: "E-post eller program",
        reply:
          "Nova IT behöver konto, MFA-läge, licens och vilken app eller vilket program som ska användas.",
      },
    ],
    serviceSlug: "datorinstallation",
  },
  {
    id: "office-network",
    label: "Nätverk för kontor eller förening",
    title: "Nätverk för kontor, förening eller flytt",
    keywords: [
      "kontoret",
      "föreningen",
      "flytta kontor",
      "nytt kontor",
      "ny lokal",
      "gästnät",
      "gäst-wifi",
      "flera arbetsplatser",
      "nätverkskarta",
      "switch",
      "accesspunkt",
      "täckning i lokalen",
      "dålig täckning på kontoret",
    ],
    intro:
      "Nätverk för en verksamhet eller förening skiljer sig från hemmabruk - fler enheter, gästaccess och driftsäkerhet väger tyngre än toppfart.",
    firstSteps: [
      "Skriv ungefär hur många personer och enheter som ska använda nätet.",
      "Notera om ni behöver ett separat gästnät.",
      "Beskriv lokalen: antal rum, våningar och kända problemområden.",
    ],
    escalation:
      "Be om en genomgång i god tid före en flytt eller ombyggnad - nätverk är enklare att planera rätt än att laga i efterhand.",
    question: "Vad gäller det främst?",
    options: [
      {
        id: "office-coverage",
        label: "Dålig täckning i lokalen",
        reply: "Skriv vilka rum eller ytor som har sämst täckning och hur lokalen ser ut ungefär.",
      },
      {
        id: "office-guest",
        label: "Gästnät saknas",
        reply:
          "Ett separat gästnät håller besökares enheter borta från er interna utrustning - vanligt och rimligt att sätta upp.",
      },
      {
        id: "office-move",
        label: "Flytt eller ombyggnad",
        reply: "Skriv preliminärt datum och om befintlig utrustning ska följa med eller ersättas.",
      },
      {
        id: "office-documentation",
        label: "Vill ha dokumentation",
        reply:
          "Nova IT kan kartlägga och dokumentera nätverket så att det inte bara finns i någons huvud.",
      },
    ],
    serviceSlug: "natverk",
  },
  {
    id: "booking",
    label: "Förbered support",
    title: "Förbered ett supportärende",
    keywords: [
      "boka",
      "boka tid",
      "support",
      "hjälp",
      "tid",
      "fjärrhjälp",
      "distanshjälp",
      "service",
      "kontakt",
      "komma hem",
      "besök",
    ],
    intro:
      "Guiden hjälper dig samla ett tydligt underlag innan Nova IT kontaktas, så första svaret redan träffar rätt.",
    firstSteps: [
      "Beskriv problemet kort, med egna ord.",
      "Notera enhetens modell om du känner till den.",
      "Ange om det stoppar arbete eller kan planeras in senare.",
    ],
    escalation:
      "Gå till kontaktformuläret om arbete står still eller ett konto är låst - då är det inte längre en planeringsfråga.",
    question: "Vilken hjälp passar bäst?",
    options: [
      {
        id: "book-remote",
        label: "Fjärrhjälp",
        reply:
          "Passar program, e-post, Windows och enklare felsökning som inte kräver att någon är fysiskt på plats.",
      },
      {
        id: "book-onsite",
        label: "På plats",
        reply:
          "Passar nätverk, flera datorer eller fysisk utrustning som behöver ses eller kopplas om.",
      },
      {
        id: "book-service",
        label: "Service",
        reply:
          "Passar uppgradering, ominstallation, backup eller startproblem som tar tid att lösa.",
      },
      {
        id: "book-advice",
        label: "Rådgivning",
        reply: "Passar inför köp, systemval, backup eller ett säkerhetsupplägg för verksamheten.",
      },
    ],
    serviceSlug: "it-support",
  },
  {
    id: "general",
    label: "Annat problem",
    title: "Annat IT-problem",
    keywords: ["annat", "övrigt", "vet inte", "problem", "fråga", "osäker på vad det är"],
    intro:
      "Samla enhet, önskat resultat och en exakt felbild även när kategorin är oklar - det räcker för att Nova IT ska kunna svara konkret.",
    firstSteps: [
      "Skriv vilken enhet eller tjänst det gäller.",
      "Beskriv vad du försökte göra och vad som hände istället.",
      "Skriv av felmeddelandet ordagrant om det finns ett.",
    ],
    escalation:
      "Gå vidare om problemet påverkar arbete, filer, konto eller internet, oavsett hur litet det känns.",
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
        reply: "Spara en skärmbild eller skriv av texten ordagrant - exakta ord gör stor skillnad.",
      },
      {
        id: "gen-urgent",
        label: "Det är akut",
        reply: "Beskriv vad som är blockerat och hur många som påverkas just nu.",
      },
      {
        id: "gen-contact",
        label: "Gå vidare",
        reply:
          "Kontaktformuläret hjälper dig samla uppgifter så Nova IT kan återkomma med rätt person direkt.",
      },
    ],
    serviceSlug: "it-support",
  },
];
