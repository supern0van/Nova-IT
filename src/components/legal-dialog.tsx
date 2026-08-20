import { createContext, useContext, useState, type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LegalDocumentId = "privacy" | "cookies" | "terms";

type LegalDialogContextValue = {
  openDocument: (document: LegalDocumentId) => void;
};

const LegalDialogContext = createContext<LegalDialogContextValue | null>(null);

const documents: Record<
  LegalDocumentId,
  {
    label: string;
    title: string;
    intro: string;
    sections: Array<{ heading: string; body: ReactNode }>;
  }
> = {
  privacy: {
    label: "Integritet",
    title: "Integritetspolicy",
    intro: "Så hanterar vi uppgifter när du väljer att kontakta Nova IT.",
    sections: [
      {
        heading: "Personuppgiftsansvarig",
        body: (
          <div className="space-y-1.5">
            <p className="font-medium text-slate-950">Nova IT</p>
            <p>Organisationsnummer: 19870528-0652</p>
            <p>Persikogatan 12, 165 63 Hässelby</p>
            <p>
              Kontakt: <a href="mailto:kontakt@nova-it.se">kontakt@nova-it.se</a>
            </p>
            <p>Webbplats: nova-it.se</p>
            <p>Alternativ webbadress: novait.se</p>
          </div>
        ),
      },
      {
        heading: "När uppgifter samlas in",
        body: (
          <>
            <p>
              När du väljer att skicka formuläret överförs de uppgifter du har fyllt i till Nova IT
              via vår e-postleverantör Resend. Webbplatsen använder inte formuläret som en
              kunddatabas. Uppgifterna används för att meddelandet ska kunna levereras och för att
              vi ska kunna svara på din fråga och bedöma nästa steg.
            </p>
            <p>
              Om du i stället skriver direkt till någon av våra e-postadresser behandlas uppgifterna
              i ditt meddelande på samma sätt.
            </p>
          </>
        ),
      },
      {
        heading: "Vilka uppgifter som kan behandlas",
        body: (
          <p>
            Det kan vara namn, e-postadress, telefonnummer eller annan kontaktväg, typ av hjälp,
            prioritet och din egen beskrivning. Vid vanlig användning av webbplatsen kan även
            begränsade tekniska uppgifter, till exempel IP-adress och säkerhetsloggar, behandlas för
            drift och skydd av webbplatsen. Lämna bara sådant som behövs för första kontakten.
          </p>
        ),
      },
      {
        heading: "Supportguiden på webbplatsen",
        body: (
          <>
            <p>
              Supportguiden hjälper dig sortera ditt ärende innan du kontaktar oss. Det du skriver i
              guiden stannar i din webbläsare och skickas ingenstans så länge du bara klickar dig
              igenom frågorna. Först när du väljer att gå vidare till kontaktformuläret följer dina
              svar med dit, och de skickas till oss först när du skickar formuläret.
            </p>
            <p>
              Går du vidare till kontakt följer din egen beskrivning och de val du gjort i guiden med
              in i ärendet, så att vi slipper fråga om grunderna igen. Guidens råd och checklistor
              följer inte med — de är skrivna för dig, inte för vår tekniker.
            </p>
            <p>
              Mellan guiden och kontaktformuläret sparas underlaget tillfälligt i webbläsarens
              sessionslagring i högst 30 minuter. Det raderas när det har använts, och när du stänger
              fliken. Skriv inte lösenord, personnummer eller bankuppgifter i guiden.
            </p>
          </>
        ),
      },
      {
        heading: "Ärendeguidens AI",
        body: (
          <>
            <p>
              Ärendeguiden kan använda en språkmodell som körs hos Cloudflare, vår befintliga
              driftleverantör, på två olika sätt. I den strukturerade guiden kan din beskrivning
              skickas till modellen bara för att föreslå vilket område ärendet hör hemma i och för
              att sammanfatta problemet i en mening som du får bekräfta.
            </p>
            <p>
              Väljer du i stället att skriva fritt i guidens chatt skickas hela den pågående
              konversationen (dina meddelanden och guidens tidigare svar, inte bara det senaste) till
              samma språkmodell inför varje svar, tillsammans med Nova IT:s egna, redan publika
              tjänstebeskrivningar som modellen kan hänvisa till. Modellen svarar på allmänna frågor
              om Nova IT och föreslår nästa steg - den ger aldrig felsöknings- eller
              reparationsråd, och hittar aldrig på priser.
            </p>
            <p>
              Oavsett läge är förslaget just ett förslag. Området byts aldrig automatiskt, du väljer
              själv, och guiden fungerar även om AI-stödet är avstängt eller inte svarar. Ingen
              automatisk sortering eller chattdialog fattar beslut som har rättsliga följder eller på
              liknande sätt i betydande grad påverkar dig — en människa hanterar alltid själva
              ärendet.
            </p>
            <p>
              Din text används inte för att träna modeller, och den lämnas inte vidare till någon
              annan AI-leverantör. Väljer du att gå vidare till kontaktformuläret kan ett sammandrag
              av det du skrivit i guiden eller chatten följa med in i ärendet, på samma sätt som
              beskrivs i avsnittet Supportguiden på webbplatsen ovan. Skriver du ingenting i guiden
              eller chatten sker ingen AI-behandling alls.
            </p>
          </>
        ),
      },
      {
        heading: "Säkerhet och missbruksskydd",
        body: (
          <p>
            För att förebygga automatiserat missbruk och skydda tjänsterna kan Cloudflare Turnstile,
            hastighetsbegränsning och tekniska säkerhetsloggar användas. När kundportalen används
            behandlas även uppgifter som behövs för inloggning, återställning av lösenord och
            sessionssäkerhet. Sådana skyddsåtgärder används för drift och säkerhet, inte för
            annonsering eller profilering.
          </p>
        ),
      },
      {
        heading: "Varför och med vilken grund",
        body: (
          <>
            <p>
              Förfrågningar och kontaktuppgifter används för vårt berättigade intresse av att svara,
              planera och följa upp en första kontakt. När du ber om offert, bokning eller en tjänst
              kan uppgifterna även behandlas för att vidta åtgärder inför avtal och, efter
              överenskommelse, för att fullgöra ett avtal.
            </p>
            <p>
              Om uppgifter måste sparas enligt lag, till exempel för bokföring efter ett uppdrag,
              sker behandlingen för att uppfylla en rättslig förpliktelse.
            </p>
            <p>
              Kontot i vår kundportal (se avsnittet Kundportalen nedan) skapas automatiskt när ett
              ärende registreras, utan ett separat val från dig. Det är inte i sig ett krav för att
              du ska kunna få hjälp med ärendet - du kan alltid få hjälp och statusbesked på annat
              sätt, till exempel via e-post eller telefon. Kontots skapande och drift grundas därför
              på vårt berättigade intresse av att kunna erbjuda dig ett enkelt sätt att följa och
              kommunicera om ditt ärende, inte på att det skulle vara ett avtalskrav.
            </p>
          </>
        ),
      },
      {
        heading: "Mottagare och tekniska leverantörer",
        body: (
          <>
            <p>
              Vi säljer inte personuppgifter och använder dem inte för annonsering. När du skickar
              formuläret används Resend för att leverera e-post till Nova IT. Resend behandlar de
              uppgifter som krävs för leveransen. När du skriver direkt till någon av våra
              e-postadresser behandlas meddelandet av vår e-postleverantör.
            </p>
            <p>
              Webbplatsen levereras och skyddas genom Cloudflare. Cloudflare kan därför behandla
              teknisk trafikdata, inklusive IP-adress, för drift och säkerhet. Cloudflares globala
              nätverk kan innebära behandling utanför EU/EES med de skyddsåtgärder som krävs enligt
              tillämplig dataskyddslagstiftning.
            </p>
            <p>
              Om ett konto skapas åt dig i vår kundportal (se nästa avsnitt) lagras dina uppgifter
              hos Supabase, som levererar databas och inloggning för den tjänsten.
            </p>
          </>
        ),
      },
      {
        heading: "Kundportalen",
        body: (
          <>
            <p>
              När ett ärende registreras kan ett konto i Nova IT:s kundportal skapas automatiskt åt
              dig, så att du kan följa och svara på ditt ärende. Du får då ett separat mejl med en
              säker, tidsbegränsad aktiveringslänk - inget lösenord skickas eller lagras i mejlet
              eller mellan våra system. Du väljer ditt eget lösenord först när du öppnar länken.
            </p>
            <p>
              I kundportalen kan du se dina egna ärenden, deras status och den konversation som förs
              kring dem, samt skriva svar. Du ser aldrig andra kunders ärenden eller uppgifter.
            </p>
            <p>
              Kontot är knutet till kundrelationen och kan finnas kvar efter att ett enskilt ärende
              avslutats, så det har inte automatiskt samma sparandetid som ärendet. Vi tar bort
              kontot senast 24 månader efter din senaste inloggning eller ärendeaktivitet, om inte
              ett nytt ärende under tiden förnyar den perioden. Du kan när som helst be oss avsluta
              kontot tidigare - det påverkar inte din rätt att få hjälp med ditt ärende på annat
              sätt.
            </p>
          </>
        ),
      },
      {
        heading: "Hur länge uppgifterna sparas",
        body: (
          <>
            <p>
              Vi sparar uppgifter bara så länge de behövs. En första förfrågan som inte leder till
              ett ärende gallras senast 12 månader efter senaste kontakt. Uppgifter som behövs för
              ett uppdrag eller enligt lag sparas så länge som krävs för det ändamålet eller enligt
              lag.
            </p>
            <p>
              Ett kundportalskonto följer kundrelationen, se avsnittet Kundportalen ovan, och tas
              bort senast 24 månader efter din senaste inloggning eller ärendeaktivitet.
            </p>
          </>
        ),
      },
      {
        heading: "Dina rättigheter och kontakt",
        body: (
          <>
            <p>
              Du kan begära information om uppgifter som rör dig, rättelse, radering, begränsning
              eller invända mot behandling när reglerna ger dig den rätten. Det gäller även
              kundportalskontot, som grundas på berättigat intresse (se avsnittet Kundportalen
              ovan). Du kan också ha rätt att få ut uppgifter i ett överförbart format.
            </p>
            <p>
              Kontakta <a href="mailto:kontakt@nova-it.se">kontakt@nova-it.se</a> först. Du kan även
              lämna klagomål till Integritetsskyddsmyndigheten (IMY).
            </p>
          </>
        ),
      },
    ],
  },
  cookies: {
    label: "Kakor",
    title: "Kakor och lokal lagring",
    intro: "Tydlig information om kakor, lokal lagring och teknisk drift.",
    sections: [
      {
        heading: "Kakor och lokal lagring i dag",
        body: (
          <p>
            Nova IT använder för närvarande inga kakor för statistik, annonsering eller
            marknadsföring och ingen lokal lagring för sådana ändamål. Vi använder inte heller
            externa analysverktyg på den publika webbplatsen.
          </p>
        ),
      },
      {
        heading: "Nödvändiga tekniker",
        body: (
          <p>
            Drift- och säkerhetstjänster kan använda strikt nödvändiga tekniker för att leverera och
            skydda webbplatsen. Sådana tekniker används inte för marknadsföring eller analys och
            kräver normalt inte samtycke.
          </p>
        ),
      },
      {
        heading: "Lokal lagring vi faktiskt använder",
        body: (
          <div className="space-y-2">
            <p>Två saker sparas lokalt i din webbläsare, båda för att sidan ska fungera:</p>
            <p>
              <span className="font-medium text-slate-950">Ditt samtyckesval.</span> Sparas tills du
              ändrar eller raderar det, så att du slipper svara på frågan varje gång.
            </p>
            <p>
              <span className="font-medium text-slate-950">Underlag från supportguiden.</span> Om du
              går från guiden till kontaktformuläret sparas dina svar tillfälligt i webbläsarens
              sessionslagring, i högst 30 minuter, så att formuläret kan fyllas i åt dig. Det raderas
              när det använts och när du stänger fliken. Det skickas ingenstans förrän du skickar
              formuläret.
            </p>
            <p>
              Ingen av dem används för statistik, annonsering eller för att följa dig mellan
              webbplatser.
            </p>
          </div>
        ),
      },
      {
        heading: "Hur samtycke hanteras",
        body: (
          <p>
            Webbplatsen visar en samtyckesbanner där du kan neka alla valfria kategorier, spara ett
            eget val eller godkänna alla. I nuläget aktiveras inga statistik- eller
            marknadsföringsskript utan ett uttryckligt val.
          </p>
        ),
      },
      {
        heading: "Ändringar",
        body: (
          <p>
            Den här informationen uppdateras om webbplatsens teknik förändras. Den aktuella
            versionen finns alltid via länken Kakor i sidfoten.
          </p>
        ),
      },
      {
        heading: "Frågor",
        body: (
          <p>
            Har du frågor om hur webbplatsen fungerar, skriv till{" "}
            <a href="mailto:kontakt@nova-it.se">kontakt@nova-it.se</a>.
          </p>
        ),
      },
    ],
  },
  terms: {
    label: "Webbplatsvillkor",
    title: "Villkor för webbplatsen",
    intro: "Tydliga ramar för informationen och första kontakten på webbplatsen.",
    sections: [
      {
        heading: "Om villkoren",
        body: (
          <p>
            Villkoren beskriver användningen av nova-it.se och novait.se. Integritetspolicyn
            beskriver separat hur personuppgifter behandlas när du kontaktar Nova IT eller använder
            webbplatsen.
          </p>
        ),
      },
      {
        heading: "Information och tillgänglighet",
        body: (
          <p>
            Webbplatsen beskriver hur vi arbetar och vilken hjälp Nova IT kan erbjuda. Innehållet är
            vägledande, kan ändras och ersätter inte en bedömning av ett enskilt ärende. Vi arbetar
            för att informationen ska vara korrekt och att webbplatsen fungerar tillgängligt, men
            kan inte garantera oavbruten tillgång.
          </p>
        ),
      },
      {
        heading: "Förfrågan, pris och uppdrag",
        body: (
          <>
            <p>
              En förfrågan innebär inte en bokning, ett pris eller ett bindande uppdrag. Innan
              arbete påbörjas stämmer vi av omfattning, nästa steg och eventuella villkor eller
              kostnader.
            </p>
            <p>
              Vissa ärenden kan få en ändrad prisbild när service eller felsökning visar sådant som
              inte gick att bedöma från början. Om något påverkar priset kontaktar vi dig, beskriver
              nästa steg och inväntar ditt godkännande innan fortsatt arbete påbörjas till den nya
              kostnaden.
            </p>
          </>
        ),
      },
      {
        heading: "Trygg kontakt",
        body: (
          <p>
            Beskriv gärna vad du märker och vad som redan har testats. Skicka aldrig lösenord,
            bankuppgifter, personnummer eller annan känslig information i en första kontakt.
          </p>
        ),
      },
      {
        heading: "Immateriella rättigheter och projektmaterial",
        body: (
          <>
            <p>
              Webbplatsens texter, bilder, grafik och övriga material skyddas av upphovsrätt och
              andra tillämpliga rättigheter. Materialet får inte användas utöver vad som är tillåtet
              enligt lag eller med Nova IT:s tillstånd.
            </p>
            <p>
              Projektpresentationen för Projekt Återbruk är upphovsrättsligt skyddad. Den får inte
              kopieras, publiceras, bearbetas eller spridas vidare utöver vad som är tillåtet enligt
              lag eller utan skriftligt tillstånd från Nova IT.
            </p>
            <p>
              Om du vill använda något material i ett annat sammanhang, skriv till{" "}
              <a href="mailto:kontakt@nova-it.se">kontakt@nova-it.se</a>.
            </p>
          </>
        ),
      },
    ],
  },
};

export function LegalDialogProvider({ children }: { children: ReactNode }) {
  const [activeDocument, setActiveDocument] = useState<LegalDocumentId | null>(null);
  const document = activeDocument ? documents[activeDocument] : null;

  return (
    <LegalDialogContext.Provider value={{ openDocument: setActiveDocument }}>
      {children}
      <Dialog
        open={activeDocument !== null}
        onOpenChange={(open) => !open && setActiveDocument(null)}
      >
        <DialogContent className="max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-2xl gap-0 overflow-hidden border-slate-300 bg-white p-0 text-slate-800 shadow-2xl sm:rounded-lg">
          {document && <LegalDocument document={document} />}
        </DialogContent>
      </Dialog>
    </LegalDialogContext.Provider>
  );
}

export function LegalDialogTrigger({
  document,
  children,
  className,
}: {
  document: LegalDocumentId;
  children: ReactNode;
  className?: string;
}) {
  const context = useContext(LegalDialogContext);

  if (!context) {
    throw new Error("LegalDialogTrigger must be used inside LegalDialogProvider.");
  }

  return (
    <button type="button" className={className} onClick={() => context.openDocument(document)}>
      {children}
    </button>
  );
}

function LegalDocument({ document }: { document: (typeof documents)[LegalDocumentId] }) {
  return (
    <div className="max-h-[calc(100svh-2rem)] overflow-y-auto">
      <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5 pr-14 text-left sm:px-8">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-md bg-sky-600 shadow-sm shadow-sky-950/20">
            <img src="/nova-it-mark-inverse.svg" alt="Nova IT" className="h-full w-full" />
          </span>
          <span className="text-sm font-bold tracking-wide text-sky-700">NOVA IT</span>
        </div>
        <p className="pt-4 text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
          {document.label} · Version 1.3
        </p>
        <DialogTitle className="pt-1 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
          {document.title}
        </DialogTitle>
        <DialogDescription className="pt-2 text-sm leading-6 text-slate-600 sm:text-base">
          {document.intro}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-7">
        {document.sections.map((section, index) => (
          <section
            key={section.heading}
            className="border-b border-slate-200 pb-6 last:border-b-0 last:pb-0"
          >
            <div className="flex items-baseline gap-3">
              <span className="text-xs font-bold tabular-nums text-sky-700">1.{index}</span>
              <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
                {section.heading}
              </h2>
            </div>
            <div className="mt-3 space-y-3 text-sm leading-6 text-slate-700 sm:text-[15px]">
              {section.body}
            </div>
          </section>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500 sm:px-8">
        <span>Senast uppdaterad 20 augusti 2026</span>
        <a
          href="https://www.nova-it.se"
          className="inline-flex items-center gap-1 font-medium text-sky-700 hover:text-sky-900"
        >
          nova-it.se <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
