import { createFileRoute } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { contactChannels, faqs } from "@/lib/nova-data";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Vanliga frågor – Nova IT" },
      {
        name: "description",
        content:
          "Svar på vanliga frågor om Nova IT som fiktivt demoexempel, formulärflöde, supportguide och säkra demouppgifter.",
      },
      { property: "og:title", content: "Vanliga frågor – Nova IT" },
      {
        property: "og:description",
        content: "Demo-säkra svar om tjänster, formulär, supportguide och fiktiva uppgifter.",
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm font-medium uppercase text-muted-foreground">FAQ</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Vanliga frågor</h1>
      <p className="mt-3 text-muted-foreground">
        Frågorna förklarar både tjänsteupplägget och vad som är fiktivt. Demo-adressen är{" "}
        {contactChannels.email}.
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
