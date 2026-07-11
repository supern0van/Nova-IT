import { createFileRoute } from "@tanstack/react-router";
import { Container, CTASection, TrustNotice, PageHeader } from "@/components/design-system";
import { SupportGuide } from "@/features/support/SupportGuide";

export const Route = createFileRoute("/assistent")({
  head: () => ({
    meta: [
      { title: "Nova-guiden – Nova IT" },
      {
        name: "description",
        content: "Nova-guiden hjälper dig beskriva IT-problemet och välja rätt supportområde.",
      },
    ],
  }),
  component: GuidePage,
});

function GuidePage() {
  return (
    <>
      <PageHeader
        eyebrow="Nova-guiden"
        title="Sortera problemet innan du beskriver ärendet."
        intro="Nova-guiden hjälper dig välja rätt supportområde och sammanfatta problemet. Den ersätter inte teknisk bedömning, utan gör kontakten med Nova IT tydligare."
        aside={<TrustNotice className="mt-5" />}
      />

      <Container className="py-14">
        <SupportGuide />
      </Container>

      <CTASection
        title="Guiden förbereder ärendet. Formuläret samlar resten."
        text="Använd sammanfattningen som underlag när du kontaktar Nova IT. Det gör det lättare att avgöra om ärendet passar fjärrsupport, service eller besök."
        secondaryTo="/tjanster"
        secondaryLabel="Jämför tjänster"
      />
    </>
  );
}
