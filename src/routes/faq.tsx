import { createFileRoute } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/lib/nova-data";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Vanliga frågor – Nova IT" },
      {
        name: "description",
        content:
          "Svar på vanliga frågor om priser, svarstider, distans- och platsstöd, datasäkerhet och backup.",
      },
      { property: "og:title", content: "Vanliga frågor – Nova IT" },
      {
        property: "og:description",
        content: "Priser, svarstider, säkerhet — vi svarar på det ni undrar.",
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Vanliga frågor</h1>
      <p className="mt-3 text-muted-foreground">
        Hittar du inte svaret? Skriv till oss på hej@novait.se så återkommer vi samma dag.
      </p>
      <Accordion type="single" collapsible className="mt-8">
        {faqs.map((f) => (
          <AccordionItem key={f.q} value={f.q}>
            <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
