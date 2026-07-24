import { createFileRoute } from "@tanstack/react-router";
import { Container, PageHeader } from "@/components/design-system";
import { SupportGuide } from "@/features/support/SupportGuide";

export const Route = createFileRoute("/assistent")({
  head: () => ({
    meta: [
      { title: "Förbered ditt IT-ärende – Nova IT" },
      {
        name: "description",
        content:
          "Beskriv vad som krånglar och få hjälp att samla rätt underlag innan du kontaktar Nova IT.",
      },
    ],
  }),
  component: AssistantPage,
});

function AssistantPage() {
  return (
    <>
      <PageHeader
        eyebrow="Automatisk ärendeguide"
        title="Ett bättre supportärende börjar med rätt frågor."
        intro="Guiden hjälper dig att välja ärendetyp, beskriva påverkan och samla underlaget Nova IT behöver. Den felsöker inte och ersätter inte en tekniker."
      />
      <section className="nova-section">
        <Container className="py-10 sm:py-14">
          <SupportGuide />
        </Container>
      </section>
    </>
  );
}
