import { createFileRoute } from "@tanstack/react-router";
import { services } from "@/lib/nova-data";
import { ServiceCatalog } from "@/components/service-catalog";
import { ServiceAreas } from "@/components/service-areas";
import { ProjectProof } from "@/components/project-proof";
import { Container, PageHeader } from "@/components/design-system";

const tjansterUrl = "https://nova-it.se/tjanster";
const tjansterTitle = "Tjänster – Nova IT";
const tjansterDescription = "Praktisk IT-hjälp för datorer, nätverk, installationer och konton.";

export const Route = createFileRoute("/tjanster")({
  head: () => ({
    meta: [
      { title: tjansterTitle },
      { name: "description", content: tjansterDescription },
      { property: "og:title", content: tjansterTitle },
      { property: "og:description", content: tjansterDescription },
      { property: "og:url", content: tjansterUrl },
    ],
    links: [{ rel: "canonical", href: tjansterUrl }],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tjänster"
        title="Hjälp när tekniken behöver fungera."
        intro="Vi hjälper till med datorer, nätverk, konton och installationer. Här ser du områdena och vad de omfattar."
      />

      <section className="nova-section">
        <Container className="py-14 sm:py-16">
          <div className="max-w-2xl">
            <p className="eyebrow">Områden</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-balance sm:text-4xl">
              Tre områden. Ett tydligt nästa steg.
            </h2>
          </div>
          <div className="mt-8">
            <ServiceAreas />
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t border-white/12 pt-10 sm:mt-16 sm:flex-row sm:items-end sm:justify-between sm:pt-12">
            <div>
              <p className="eyebrow">Tjänster i korthet</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal">
                Det här kan vi hjälpa till med.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-400">
              Här ser du vad varje område omfattar. När du kontaktar Nova IT väljer du enkelt det
              som ligger närmast, och valet går alltid att ändra.
            </p>
          </div>
          <ServiceCatalog services={services} />
          <ProjectProof />
        </Container>
      </section>
    </>
  );
}
