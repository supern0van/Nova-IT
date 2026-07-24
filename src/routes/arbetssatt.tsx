import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, MonitorCog, ShieldCheck } from "lucide-react";
import { Container, PageHeader } from "@/components/design-system";

export const Route = createFileRoute("/arbetssatt")({
  head: () => ({
    meta: [
      { title: "Arbetssätt – Nova IT" },
      {
        name: "description",
        content:
          "Så arbetar Nova IT från första ärendebeskrivning till felsökning, åtgärd och uppföljning.",
      },
    ],
  }),
  component: WorkMethodPage,
});

const stages = [
  {
    icon: ClipboardList,
    title: "Du berättar vad som krånglar",
    text: "Beskriv det du märker. Du behöver inte veta vad den tekniska orsaken är.",
  },
  {
    icon: ShieldCheck,
    title: "Vi går igenom läget",
    text: "Vi bedömer ärendet och återkommer om fortsatt felsökning, åtgärd eller bokning är rätt nästa steg.",
  },
  {
    icon: MonitorCog,
    title: "Vi planerar hjälpen",
    text: "När vi vet mer bestämmer vi tillsammans vad som behöver göras och när.",
  },
];

function WorkMethodPage() {
  return (
    <>
      <PageHeader
        eyebrow="Arbetssätt"
        title="Tydligt från första kontakten."
        intro="Du beskriver vad som krånglar. Nova IT bedömer sedan vad som behöver göras för att ta ärendet vidare."
      />

      <section className="nova-section">
        <Container className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
              Så går det till
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-balance">
              Så går det till.
            </h2>
            <p className="mt-4 leading-7 text-slate-300">
              Målet är enkelt: du ska kunna få hjälp utan att först behöva bli tekniker själv.
            </p>
          </div>

          <ol className="divide-y divide-white/10 border-y border-white/10">
            {stages.map((stage) => (
              <li key={stage.title} className="flex gap-4 py-6 sm:gap-6 sm:py-8">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-sky-300/15 bg-sky-300/8 text-sky-200">
                  <stage.icon className="h-4 w-4" />
                </span>
                <div className="pt-0.5">
                  <h3 className="text-xl font-semibold tracking-normal">{stage.title}</h3>
                  <p className="mt-2 max-w-xl leading-7 text-slate-300">{stage.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </>
  );
}
