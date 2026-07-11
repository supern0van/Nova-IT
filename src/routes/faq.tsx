import { createFileRoute } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/lib/nova-data";
import { Container, CTASection, TrustNotice, PageHeader } from "@/components/design-system";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Vanliga frågor – Nova IT" },
      {
        name: "description",
        content: "Svar om Nova IT:s support, tjänster, distanshjälp, säkerhet och bokning.",
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
        title="Tydliga svar innan du bokar IT-hjälp."
        intro="Här finns korta svar om hur Nova IT kan hjälpa, vad som passar för distanssupport och när ärendet bör prioriteras."
      />
      <Container className="grid gap-10 py-14 lg:grid-cols-[0.68fr_1.32fr]">
        <div>
          <TrustNotice />
          <p className="mt-6 text-sm leading-6 text-muted-foreground">
            Hittar du inte rätt svar är det bättre att beskriva problemet än att lägga tid på egen
            felsökning. Nova IT kan hjälpa dig välja rätt väg.
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
        text="Kontaktformuläret samlar informationen som behövs för att Nova IT ska kunna bedöma nästa steg."
      />
    </>
  );
}
