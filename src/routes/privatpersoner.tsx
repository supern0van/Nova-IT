import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, PageHeader } from "@/components/design-system";
import { serviceRegion } from "@/lib/service-region";

export const Route = createFileRoute("/privatpersoner")({
  head: () => ({
    meta: [
      { title: "IT-hjälp för privatpersoner – Nova IT" },
      {
        name: "description",
        content:
          "Praktisk IT-hjälp för privatpersoner i Hässelby, Västerort, Bromma och Stockholms innerstad med datorer, Wi-Fi, konton, installationer och backup.",
      },
    ],
    links: [{ rel: "canonical", href: "https://nova-it.se/privatpersoner" }],
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

function PrivateCustomersPage() {
  return (
    <>
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
              <Link to="/kontakt" search={{ form: "request", service: undefined }}>
                Beskriv ditt ärende
              </Link>
            </Button>
          </aside>
        </Container>
      </section>
    </>
  );
}
