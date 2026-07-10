import { createFileRoute } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/lib/nova-data";
import { Container, CTASection, DemoNotice, PageHeader } from "@/components/design-system";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Vanliga frågor – Nova IT" },
      {
        name: "description",
        content:
          "Demo-säkra svar om tjänster, formulär, Frågeguiden, datahantering och en möjlig framtida skarp version.",
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="Vanliga frågor"
        title="Tydliga svar om demon och tjänsteupplägget."
        intro="Här skiljer vi på vad frontend-demon faktiskt gör och vad som skulle kräva riktiga avtal, kontaktvägar, dataskydd och supportprocesser."
      />
      <Container className="grid gap-10 py-14 lg:grid-cols-[0.68fr_1.32fr]">
        <div>
          <DemoNotice />
          <p className="mt-6 text-sm leading-6 text-muted-foreground">
            Frågorna undviker bindande priser och servicenivåer. De visar i stället vilken
            information en skarp sida behöver göra tydlig.
          </p>
        </div>
        <Accordion
          type="single"
          collapsible
          className="rounded-lg border border-border bg-card px-5"
        >
          {faqs.map((faq) => (
            <AccordionItem key={faq.q} value={faq.q}>
              <AccordionTrigger className="text-left text-base">{faq.q}</AccordionTrigger>
              <AccordionContent className="leading-7 text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
      <CTASection
        title="Hittar du inte rätt fråga? Börja med problemet."
        text="Frågeguiden hjälper dig välja område och kontaktformuläret visar vilken information som normalt behövs."
      />
    </>
  );
}
