import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, PageHeader } from "@/components/design-system";
import { getServiceBySlug } from "@/lib/nova-data";
import { serviceRegion } from "@/lib/service-region";

export const Route = createFileRoute("/foretag-foreningar")({
  head: () => ({
    meta: [
      { title: "IT-stöd för småföretag och föreningar – Nova IT" },
      {
        name: "description",
        content:
          "Praktiskt IT-stöd för mindre företag och föreningar i Västerort, Bromma och Stockholms innerstad med arbetsplatser, nätverk, konton och backup.",
      },
    ],
    links: [{ rel: "canonical", href: "https://nova-it.se/foretag-foreningar" }],
  }),
  component: BusinessCustomersPage,
});

const needs = [
  "Nya datorer och användarkonton behöver sättas upp",
  "E-post, kalender eller delade dokument fungerar inte som tänkt",
  "Wi-Fi, nätverk eller gästnät behöver förbättras",
  "Behörigheter och tvåfaktorsinloggning behöver ses över",
  "Backup, dokumentation och återställning behöver bli tydligare",
];

const preparations = [
  "Ungefär hur många användare och enheter det gäller",
  "Vilka molntjänster eller program ni redan använder",
  "Om problemet påverkar en person eller hela verksamheten",
  "Om det finns en kontaktperson som känner till nuvarande uppsättning",
];

const relatedServiceSlugs = ["natverk", "microsoft-google", "sakerhet-backup"] as const;

function BusinessCustomersPage() {
  return (
    <>
      <PageHeader
        eyebrow="För mindre verksamheter"
        title="Praktiskt IT-stöd utan en egen IT-avdelning."
        intro="Nova IT hjälper småföretag och föreningar att få ordning på arbetsplatser, nätverk, konton och grundläggande säkerhet."
      />

      <section className="nova-section">
        <Container className="grid gap-10 py-16 lg:grid-cols-[1fr_0.8fr] lg:items-start">
          <div>
            <p className="eyebrow">Vanliga behov</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-balance">
              När verksamheten behöver fungera utan onödiga avbrott.
            </h2>
            <ul className="mt-7 space-y-4">
              {needs.map((need) => (
                <li key={need} className="flex gap-3 text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
                  <span>{need}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="rounded-lg border border-white/10 bg-white/5 p-6">
            <p className="eyebrow">Lokalt upplägg</p>
            <h2 className="mt-3 text-2xl font-semibold">{serviceRegion.title}</h2>
            <p className="mt-4 leading-7 text-slate-300">{serviceRegion.description}</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">{serviceRegion.practicalNote}</p>
            <Button asChild className="mt-6 w-full">
              <Link to="/kontakt" search={{ form: "request", service: undefined }}>
                Skicka en förfrågan
              </Link>
            </Button>
          </aside>
        </Container>
      </section>

      <section className="nova-section-muted">
        <Container className="py-14 sm:py-16">
          <p className="eyebrow">Inför kontakten</p>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-normal text-balance sm:text-3xl">
            Bra att ha med sig när ni hör av er.
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
            Ni behöver inte ha svar på allt själva - vi hjälper er att reda ut resten.
          </p>
        </Container>
      </section>

      <section className="nova-section">
        <Container className="py-14 sm:py-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Relaterade tjänster</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal">
                Så här kan stödet se ut.
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
