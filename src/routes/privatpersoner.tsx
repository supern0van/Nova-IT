import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, PageHeader } from "@/components/design-system";
import { getServiceBySlug } from "@/lib/nova-data";
import { serviceRegion } from "@/lib/service-region";
import { buildBreadcrumbJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/json-ld";

const pageUrl = "https://nova-it.se/privatpersoner";
const pageTitle = "IT-hjälp för privatpersoner – Nova IT";
const pageDescription =
  "Praktisk IT-hjälp för privatpersoner i Hässelby, Västerort, Bromma och Stockholms innerstad med datorer, Wi-Fi, konton, installationer och backup.";
const socialImageUrl = "https://nova-it.se/nova-it-workspace.png";

export const Route = createFileRoute("/privatpersoner")({
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
  component: PrivateCustomersPage,
});

const situations = [
  "Datorn är långsam, instabil eller svår att komma igång med",
  "Wi-Fi fungerar dåligt i delar av bostaden",
  "En ny dator behöver installeras och filer flyttas",
  "Konton, e-post, skrivare eller program krånglar",
  "Backup och grundläggande säkerhet behöver ses över",
];

const preparations = [
  "Vad som händer och när du märkte det första gången",
  "Om felet är återkommande eller om det hände en gång",
  "Eventuella felmeddelanden, gärna som skärmbild",
  "Vilken dator, router eller tjänst det gäller",
];

const relatedServiceSlugs = ["it-support", "datorinstallation", "sakerhet-backup"] as const;

function PrivateCustomersPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Hem", url: "https://nova-it.se/" },
          { name: "Privatpersoner", url: pageUrl },
        ])}
      />
      <PageHeader
        eyebrow="För privatpersoner"
        title="IT-hjälp utan onödigt teknikspråk."
        intro="Du beskriver vad som inte fungerar. Vi hjälper dig att ringa in problemet och bedöma ett rimligt nästa steg."
      />

      <section className="nova-section">
        <Container className="grid gap-10 py-16 lg:grid-cols-[1fr_0.8fr] lg:items-start">
          <div>
            <p className="eyebrow">Vanliga situationer</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-balance">
              När tekniken står i vägen för vardagen.
            </h2>
            <ul className="mt-7 space-y-4">
              {situations.map((situation) => (
                <li key={situation} className="flex gap-3 text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
                  <span>{situation}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="rounded-lg border border-white/10 bg-white/5 p-6">
            <p className="eyebrow">Lokalt och tydligt</p>
            <h2 className="mt-3 text-2xl font-semibold">{serviceRegion.title}</h2>
            <p className="mt-4 leading-7 text-slate-300">{serviceRegion.description}</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">{serviceRegion.practicalNote}</p>
            <Button asChild className="mt-6 w-full">
              <Link to="/kontakt" search={{ form: "request" }}>
                Beskriv ditt ärende
              </Link>
            </Button>
          </aside>
        </Container>
      </section>

      <section className="nova-section-muted">
        <Container className="py-14 sm:py-16">
          <p className="eyebrow">Inför kontakten</p>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-normal text-balance sm:text-3xl">
            Bra att ha med sig när du hör av dig.
          </h2>
          <ul className="mt-7 grid gap-4 sm:grid-cols-2">
            {preparations.map((item) => (
              <li key={item} className="flex gap-3 text-slate-300">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-400">
            Du behöver inte ha svar på allt - berätta det du vet, så hjälper vi dig med resten.
          </p>
        </Container>
      </section>

      <section className="nova-section">
        <Container className="py-14 sm:py-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Relaterade tjänster</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal">
                Så här kan hjälpen se ut.
              </h2>
            </div>
            <Link to="/tjanster" className="text-sm font-medium text-sky-300 hover:text-sky-200">
              Se alla tjänster
            </Link>
          </div>
          <ul className="mt-8 grid gap-5 sm:grid-cols-3">
            {relatedServiceSlugs.map((slug) => {
              const service = getServiceBySlug(slug);
              if (!service) return null;
              return (
                <li key={slug}>
                  <Link
                    to="/tjanster/$slug"
                    params={{ slug }}
                    className="block h-full rounded-lg border border-white/10 bg-white/5 p-5 transition-colors hover:border-sky-300/40 hover:bg-white/8"
                  >
                    <h3 className="font-semibold">{service.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{service.description}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sky-300">
                      Läs mer <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>
    </>
  );
}
