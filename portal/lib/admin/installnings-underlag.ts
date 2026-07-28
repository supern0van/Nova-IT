import type {
  Arendekategori,
  Aviseringsinstallning,
  EpostMottagare,
  Standardsvar,
} from '@/lib/types'

/**
 * Read-only underlag för admininställningar som ännu saknar serverlagring.
 *
 * Detta ligger avsiktligt utanför `demo-data.ts`/localStorage så att
 * inställningssidan inte blandar verkliga systemkontroller med operativ
 * demodata för ärenden, kunder och bokningar.
 */

export const adminKategorierUnderlag: Arendekategori[] = [
  {
    id: 'kat-1',
    namn: 'Datorer och vardags-IT',
    nyckel: 'datorer_vardags_it',
    underkategorier: [
      'Prestanda och långsamhet',
      'Skrivare och kringutrustning',
      'Uppgradering av hårdvara',
      'Program och licenser',
    ],
    standardPrioritet: 'normal',
    aktiv: true,
  },
  {
    id: 'kat-2',
    namn: 'Nätverk och Wi-Fi',
    nyckel: 'natverk_wifi',
    underkategorier: [
      'Instabil anslutning',
      'Täckning och räckvidd',
      'Kabelnät och switchar',
      'Router och brandvägg',
    ],
    standardPrioritet: 'hog',
    aktiv: true,
  },
  {
    id: 'kat-3',
    namn: 'Konton, moln och säkerhet',
    nyckel: 'konton_moln_sakerhet',
    underkategorier: [
      'Microsoft 365 och behörigheter',
      'Tvåfaktorsautentisering',
      'Backup och återställning',
      'Google Workspace',
    ],
    standardPrioritet: 'hog',
    aktiv: true,
  },
  {
    id: 'kat-4',
    namn: 'Installation och flytt',
    nyckel: 'installation',
    underkategorier: ['Ny dator och dataflytt', 'Arbetsplats och onboarding', 'Kontorsflytt'],
    standardPrioritet: 'normal',
    aktiv: true,
  },
  {
    id: 'kat-5',
    namn: 'Virus och säkerhetsincident',
    nyckel: 'sakerhet_virus',
    underkategorier: ['Skadlig kod och varningar', 'Nätfiske', 'Intrångsmisstanke'],
    standardPrioritet: 'kritisk',
    aktiv: true,
  },
]

export const adminStandardsvarUnderlag: Standardsvar[] = [
  {
    id: 'std-1',
    rubrik: 'Bekräftelse på mottaget ärende',
    kategori: 'Allmänt',
    text: 'Hej {{kundnamn}},\n\nTack för att du hörde av dig. Vi har tagit emot ditt ärende och en tekniker återkommer under kontorstid, normalt inom en arbetsdag.\n\nVänliga hälsningar\n{{tekniker}}, Nova IT',
  },
  {
    id: 'std-2',
    rubrik: 'Förslag på tid för hembesök',
    kategori: 'Bokning',
    text: 'Hej {{kundnamn}},\n\nJag föreslår att vi ses {{datum}} kl. {{tid}}. Räkna med ungefär {{langd}}.\n\nSvara gärna om tiden passar, annars hittar vi en annan.\n\nVänliga hälsningar\n{{tekniker}}, Nova IT',
  },
  {
    id: 'std-3',
    rubrik: 'Begäran om kompletterande uppgifter',
    kategori: 'Allmänt',
    text: 'Hej {{kundnamn}},\n\nFör att komma vidare behöver jag veta lite mer:\n\n– När uppstod problemet första gången?\n– Händer det varje gång eller ibland?\n– Har något ändrats i din utrustning nyligen?\n\nDu behöver inte kunna den tekniska orsaken, beskriv bara vad du märker.\n\nVänliga hälsningar\n{{tekniker}}, Nova IT',
  },
  {
    id: 'std-4',
    rubrik: 'Ärendet är åtgärdat',
    kategori: 'Avslut',
    text: 'Hej {{kundnamn}},\n\nNu ska allt fungera som det ska igen. Jag har åtgärdat {{atgard}}.\n\nHör av dig om något krånglar, då tittar vi på det utan extra kostnad inom 14 dagar.\n\nVänliga hälsningar\n{{tekniker}}, Nova IT',
  },
  {
    id: 'std-5',
    rubrik: 'Säkerhetsvarning – misstänkt bedrägeri',
    kategori: 'Säkerhet',
    text: 'Hej {{kundnamn}},\n\nDu har gjort helt rätt i att inte ringa numret eller lämna ut några uppgifter. Meddelanden av det slaget är nästan alltid bedrägeriförsök.\n\nAnvänd inte internetbank eller e-legitimation på datorn förrän vi har gått igenom den tillsammans.\n\nVänliga hälsningar\n{{tekniker}}, Nova IT',
  },
]

export const adminAviseringarUnderlag: Aviseringsinstallning[] = [
  {
    id: 'avi-1',
    namn: 'Nytt ärende via kontaktformuläret',
    beskrivning: 'Avisera till gemensam inkorg när ett nytt ärende registreras.',
    aktiv: true,
  },
  {
    id: 'avi-2',
    namn: 'Nytt ärende via supportassistenten',
    beskrivning: 'Avisera direkt när assistenten skapar och sammanfattar ett ärende.',
    aktiv: true,
  },
  {
    id: 'avi-3',
    namn: 'Kritisk prioritet',
    beskrivning: 'Skicka omedelbar avisering till samtliga tekniker vid kritiskt ärende.',
    aktiv: true,
  },
  {
    id: 'avi-4',
    namn: 'Kundsvar på öppet ärende',
    beskrivning: 'Avisera ansvarig tekniker när kunden svarar.',
    aktiv: true,
  },
  {
    id: 'avi-5',
    namn: 'Påminnelse om ärenden utan svar',
    beskrivning: 'Daglig sammanställning av ärenden som varit obesvarade i mer än 24 timmar.',
    aktiv: true,
  },
  {
    id: 'avi-6',
    namn: 'Påminnelse om bokning till kund',
    beskrivning: 'Skicka påminnelse via e-post dagen före bokat besök.',
    aktiv: false,
  },
  {
    id: 'avi-7',
    namn: 'Veckorapport till verksamhetsansvarig',
    beskrivning: 'Sammanfattning av lösta ärenden och svarstider varje måndag.',
    aktiv: false,
  },
]

export const adminMottagareUnderlag: EpostMottagare[] = [
  { id: 'mot-1', epost: 'kontakt@nova-it.se', syfte: 'Gemensam inkorg, alla nya ärenden', aktiv: true },
  { id: 'mot-2', epost: 'anna@nova-it.se', syfte: 'Kritiska ärenden och veckorapport', aktiv: true },
  { id: 'mot-3', epost: 'marcus@nova-it.se', syfte: 'Tilldelade ärenden och bokningar', aktiv: true },
  { id: 'mot-4', epost: 'sofia@nova-it.se', syfte: 'Tilldelade ärenden, nätverk', aktiv: true },
  { id: 'mot-5', epost: 'faktura@nova-it.se', syfte: 'Underlag för fakturering', aktiv: false },
]
