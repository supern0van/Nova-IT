import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, HeartHandshake, MapPin, Network, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, PageHeader } from "@/components/design-system";
import { serviceRegion } from "@/lib/service-region";
import { buildBreadcrumbJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/json-ld";

const pageUrl = "https://nova-it.se/om-oss";
const pageTitle = "Om Nova IT – praktisk IT-hjälp i Västerort";
const pageDescription =
  "Nova IT utgår från Hässelby och hjälper privatpersoner, småföretag och föreningar med datorer, nätverk, felsökning och säkerhet.";
const socialImageUrl = "https://nova-it.se/nova-it-workspace.png";

export const Route = createFileRoute("/om-oss")({
  head: () => ({
    meta: [
      { title: pageTitle },
      { name: "description", content: pageDescription },
      { property: "og:title", content: pageTitle },
      { property: "og:description", content: pageDescription },
      { property: "og:url", content: pageUrl },
      { property: "og:image", content: socialImageUrl },
      { name: "twitter:title", content: pageTitle },
      { name: "twitter:description", content: pageDescription },
      { name: "twitter:image", content: socialImageUrl },
    ],
    links: [{ rel: "canonical", href: pageUrl }],
  }),
  component: About,
});

const principles = [
  {
    icon: Building2,
    title: "Praktisk hjälp",
    text: "Fokus ligger på konkreta datorproblem, nätverk, konton och installationer som behöver fungera i vardagen.",
  },
  {
    icon: ShieldCheck,
    title: "Tydlig kommunikation",
    text: "Du får veta vad som har hittats, vad som är rimligt att göra och när ytterligare bedömning behövs.",
  },
  {
    icon: HeartHandshake,
    title: "Personlig support",
    text: "Hjälpen utgår från situationen och det som faktiskt behöver fungera, inte från en färdig standardlösning.",
  },
];

function About() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Hem", url: "https://nova-it.se/" },
          { name: "Om Nova IT", url: pageUrl },
        ])}
      />
      <PageHeader
        eyebrow="Om Nova IT"
        title="Lokal IT-hjälp med fokus på nätverk, drift och felsökning."
        intro="Nova IT utgår från Hässelby och hjälper privatpersoner, småföretag och föreningar när tekniken behöver bli tydligare, stabilare och enklare att använda."
      />

      <section className="nova-section border-b border-white/10">
        <Container className="grid gap-10 py-16 lg:grid-cols-[1fr_0.8fr] lg:items-start">
          <div>
            <p className="eyebrow">Bakgrund och inriktning</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-balance">
              Byggt kring verkliga problem, inte stora ord.
            </h2>
            <div className="mt-6 space-y-4 leading-7 text-slate-300">
              <p>
                Nova IT har en teknisk inriktning mot nätverk, IT-drift och metodisk felsökning. Det
                innebär att ett ärende först ringas in innan en åtgärd eller större förändring
                föreslås.
              </p>
              <p>
                Målet är att hjälpa kunden förstå vad som händer, vad som är värt att göra och vad
                som kan vänta. Inga certifieringar, partnerskap eller resultat påstås utan att de
                kan styrkas.
              </p>
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3 text-sky-300">
              <MapPin className="h-5 w-5" />
              <span className="font-semibold">{serviceRegion.base}</span>
            </div>
            <p className="mt-4 leading-7 text-slate-300">{serviceRegion.description}</p>
            <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-slate-400">
              <Network className="h-5 w-5 text-sky-300" />
              Datorer, nätverk, konton, felsökning och grundläggande säkerhet.
            </div>
            <Button asChild className="mt-6 w-full">
              <Link to="/kontakt" search={{ form: "request" }}>
                Beskriv ditt ärende
              </Link>
            </Button>
          </aside>
        </Container>
      </section>

      <section className="nova-section">
        <Container className="py-16 sm:py-20">
          <div className="grid gap-8 md:grid-cols-3">
            {principles.map((item) => (
              <article key={item.title} className="border-t border-white/10 pt-6">
                <span className="grid h-10 w-10 place-items-center rounded-md border border-sky-300/15 bg-sky-300/8 text-sky-200">
                  <item.icon className="h-5 w-5" />
                </span>
                <h2 className="mt-5 text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
