import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, PageHeader } from "@/components/design-system";
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
    </>
  );
}
