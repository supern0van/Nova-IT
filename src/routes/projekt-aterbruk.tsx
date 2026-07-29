import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, FileText } from "lucide-react";

import { Container } from "@/components/design-system";

const projektAterbrukUrl = "https://nova-it.se/projekt-aterbruk";
const projektAterbrukTitle = "Projekt Återbruk – Nova IT";
const projektAterbrukDescription =
  "Ett dokumenterat LIA-projekt där 116 datorer inventerades, testades och förbereddes för fortsatt användning.";

export const Route = createFileRoute("/projekt-aterbruk")({
  head: () => ({
    meta: [
      { title: projektAterbrukTitle },
      { name: "description", content: projektAterbrukDescription },
      { property: "og:title", content: projektAterbrukTitle },
      { property: "og:description", content: projektAterbrukDescription },
      { property: "og:url", content: projektAterbrukUrl },
    ],
    links: [{ rel: "canonical", href: projektAterbrukUrl }],
  }),
  component: ProjectReusePage,
});

const projectSteps = [
  {
    title: "Inventera innan beslut",
    text: "Varje dator identifierades och sorterades innan tid lades på service eller installation.",
  },
  {
    title: "Kontrollera det som avgör",
    text: "Funktion, batteri, laddning, lagring och anslutningar testades för att ge ett användbart underlag.",
  },
  {
    title: "Anpassa efter verklig användning",
    text: "Operativsystem och nästa åtgärd valdes utifrån datorns skick och vad den faktiskt skulle användas till.",
  },
];

const checks = [
  ["Batteri och laddning", "Kapacitet, laddare och stabil drift."],
  ["Grundläggande funktion", "Skärm, tangentbord, portar och övrig hårdvara."],
  ["Lagring och system", "Diskhälsa, installation och förutsättningar för fortsatt drift."],
  ["Rätt användningsområde", "Om datorn fortfarande passar uppgiften den ska lösa."],
];

const systems = [
  {
    name: "Windows",
    detail: "När hårdvaran och licensförutsättningarna gav en rimlig helhet.",
  },
  {
    name: "Linux",
    detail: "När ett lättare system kunde ge äldre hårdvara ett användbart nästa steg.",
  },
  {
    name: "ChromeOS Flex",
    detail: "När enkel administration och webbaserat arbete passade användningen bäst.",
  },
];

function ProjectReusePage() {
  return (
    <div className="nova-section">
      <section className="overflow-hidden border-b border-white/10 bg-[#091119]">
        <Container className="grid min-h-[560px] items-stretch lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="flex flex-col justify-center py-20 pr-0 sm:py-24 lg:pr-16">
            <p className="eyebrow mb-7">Dokumenterat LIA-projekt</p>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] sm:text-6xl lg:text-7xl">
              116 datorer. Ett tydligare sätt att bedöma vad som faktiskt går att använda.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[#b9c8d6] sm:text-xl">
              Projekt Återbruk gav oss praktisk erfarenhet av att inventera, testa och förbereda äldre
              datorer för fortsatt användning. Samma noggrannhet ligger bakom hur vi bedömer service,
              uppgradering och nästa rimliga steg i dag.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-8 py-12 lg:border-l lg:border-white/10 lg:py-20 lg:pl-14">
            <div>
              <div className="text-[7rem] font-semibold leading-none text-[#43b6ee] sm:text-[8rem]">116</div>
              <p className="mt-3 text-xl font-semibold">datorer funktionstestades</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm">
              <div>
                <p className="text-[#7f96aa]">Fokus</p>
                <p className="mt-1 font-medium">Funktion före ålder</p>
              </div>
              <div>
                <p className="text-[#7f96aa]">Resultat</p>
                <p className="mt-1 font-medium">Över 100 redo för nästa steg</p>
              </div>
              <div>
                <p className="text-[#7f96aa]">Miljö</p>
                <p className="mt-1 font-medium">Mindre onödigt utbyte</p>
              </div>
              <div>
                <p className="text-[#7f96aa]">Genomfört</p>
                <p className="mt-1 font-medium">LIA 2026</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="nova-section-muted py-20 sm:py-28">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow mb-5">Från restlager till elevdatorer</p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-5xl">
              Bedöm först. Byt ut när det faktiskt behövs.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#aebdcc]">
              Projektet började med datorer som inte längre räknades som en användbar resurs. Vårt
              uppdrag var att ta reda på vilka som fortfarande hade mer att ge - och sedan avgöra vad
              som faktiskt kontrollerades och vilket system som passade bäst.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {projectSteps.map((step) => (
              <div key={step.title} className="border-t border-white/10 pt-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-[#43b6ee]/30 bg-[#43b6ee]/10 text-[#8ed8f7]">
                  <FileText aria-hidden="true" className="size-5" strokeWidth={1.6} />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 leading-7 text-[#aebdcc]">{step.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {checks.map(([title, text]) => (
              <div key={title} className="border-t border-white/10 pt-6">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 leading-7 text-[#9eb0c1]">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <p className="eyebrow mb-5">Rätt system för uppgiften</p>
            <p className="max-w-2xl leading-7 text-[#aebdcc]">
              Ingen standardlösning passar alla. Valet av operativsystem gjordes efter hårdvara, behov
              och förvaltning, inte efter vana eller en förutbestämd favorit.
            </p>
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {systems.map((system) => (
                <div key={system.name} className="border-t border-white/10 pt-6">
                  <h3 className="font-semibold">{system.name}</h3>
                  <p className="mt-2 leading-7 text-[#aebdcc]">{system.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-y border-[#43b6ee]/25 bg-[#0b1720] py-16 sm:py-20">
        <Container className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow mb-5">Resultatet</p>
            <h2 className="max-w-4xl text-3xl font-semibold leading-tight sm:text-5xl">
              Över 100 datorer kunde förberedas för fortsatt användning i utbildningsmiljö.
            </h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#aebdcc]">
              Det är inte ett löfte om att varje gammal dator går att rädda. Det är ett bevis på värdet
              av att undersöka ordentligt innan utrustning döms ut.
            </p>
          </div>
          <div className="text-7xl font-semibold leading-none text-[#43b6ee] sm:text-8xl">100+</div>
        </Container>
      </section>

      <section className="nova-section py-20 sm:py-28">
        <Container>
          <div className="grid overflow-hidden border border-white/10 nova-section-muted lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative min-h-[300px] overflow-hidden border-b border-white/10 lg:min-h-[540px] lg:border-b-0 lg:border-r">
              <picture>
                <source srcSet="/projekt-aterbruk/presentation-cover.webp" type="image/webp" />
                <img
                  src="/projekt-aterbruk/presentation-cover.png"
                  alt="Förstasidan ur presentationen för Projekt Återbruk"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  loading="lazy"
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-[#091119]/65 via-transparent to-transparent" />
            </div>

            <div className="flex flex-col justify-center p-7 sm:p-12 lg:p-14">
              <FileText aria-hidden="true" className="mb-8 size-8 text-[#43b6ee]" strokeWidth={1.5} />
              <p className="eyebrow mb-5">Originalmaterial</p>
              <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Se arbetet bakom resultatet.</h2>
              <p className="mt-6 text-lg leading-8 text-[#aebdcc]">
                Presentationen visar hur inventeringen genomfördes, hur datorerna bedömdes och hur
                ChromeOS Flex användes i projektet.
              </p>
              <a
                href="/projekt-aterbruk.pdf"
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex w-fit items-center gap-2 bg-[#43b6ee] px-5 py-3 font-semibold text-[#071019] transition hover:bg-[#69c7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ed8f7]"
              >
                Öppna presentationen
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </a>
              <p className="mt-8 text-sm leading-6 text-[#7f96aa]">
                Projektet genomfördes inom LIA/utbildning och är inte en kundreferens för Nova IT.
                Presentationsmaterialet är upphovsrättsligt skyddat och får inte spridas vidare utan
                uttryckligt tillstånd.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-white/10 bg-[#091119] py-16 sm:py-20">
        <Container className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow mb-4">Datorservice och uppgradering</p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Har du en dator som behöver bedömas?</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#aebdcc]">
              Berätta vad som inte fungerar eller vad du vill få ut av datorn, så börjar vi med att
              bedöma ett rimligt nästa steg.
            </p>
          </div>
          <Link
            to="/kontakt"
            search={{ form: "request", service: "datorservice" }}
            className="inline-flex w-fit items-center gap-2 bg-[#43b6ee] px-5 py-3 font-semibold text-[#071019] transition hover:bg-[#69c7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ed8f7]"
          >
            Beskriv datorn
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Container>
      </section>
    </div>
  );
}
