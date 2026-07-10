import { createFileRoute } from "@tanstack/react-router";
import { Container, CTASection, DemoNotice, PageHeader } from "@/components/design-system";
import { SupportGuide } from "@/features/support/SupportGuide";

export const Route = createFileRoute("/assistent")({
  head: () => ({
    meta: [
      { title: "Nova-guiden – Nova IT" },
      {
        name: "description",
        content:
          "Regelbaserad frontendguide med 13 spår för vanliga IT-problem och rätt tjänsteområde.",
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
        intro="Tretton regelbaserade spår hjälper dig välja säkra första kontroller och rätt tjänstekategori. Guiden gör inga AI-anrop, ingen diagnostik och skickar inga uppgifter."
        aside={<DemoNotice className="mt-5" />}
      />

      <Container className="py-14">
        <SupportGuide />
      </Container>

      <CTASection
        title="Guiden förbereder ärendet. Formuläret samlar resten."
        text="Du kan kopiera en sammanfattning och ta med den vidare. Inga personuppgifter lagras eller skickas av guiden."
        secondaryTo="/tjanster"
        secondaryLabel="Jämför tjänster"
      />
    </>
  );
}
