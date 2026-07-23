import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/lib/nova-data";
import { Container, TrustNotice, PageHeader } from "@/components/design-system";

const faqUrl = "https://nova-it.se/faq";
const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Vanliga frågor – Nova IT" },
      {
        name: "description",
        content: "Svar om hur vi hjälper med datorer, nätverk, konton och installationer.",
      },
      { property: "og:title", content: "Vanliga frågor – Nova IT" },
      {
        property: "og:description",
        content: "Korta svar om Nova IT:s hjälp med datorer, nätverk, konton och installationer.",
      },
      { property: "og:url", content: faqUrl },
    ],
    links: [{ rel: "canonical", href: faqUrl }],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <PageHeader
        eyebrow="Vanliga frågor"
        title="Vanliga frågor, utan teknikspråk."
        intro="Här finns korta svar om hur vi hjälper och vad som är bra att veta innan du hör av dig."
      />
      <section className="nova-section">
        <Container className="grid gap-10 py-14 lg:grid-cols-[0.68fr_1.32fr]">
          <div>
            <TrustNotice />
            <div className="mt-6 flex items-start gap-3">
              <p className="text-sm leading-6 text-slate-300">
                Hittar du inte rätt svar? Beskriv vad som händer, så återkommer vi med vad som är
                rimligt som nästa steg.
              </p>
              <Link
                to="/kontakt"
                search={{ service: undefined }}
                aria-label="Beskriv ett ärende"
                title="Beskriv ett ärende"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-sky-300/20 text-sky-200 transition-colors hover:border-sky-300/50 hover:bg-sky-300/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <Accordion type="single" collapsible className="border-t border-white/10">
            {faqs.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q}>
                <AccordionTrigger className="text-left text-base">{faq.q}</AccordionTrigger>
                <AccordionContent className="leading-7 text-slate-300">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </section>
    </>
  );
}
