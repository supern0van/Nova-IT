import { createFileRoute } from "@tanstack/react-router";
import { Building2, HeartHandshake, ShieldCheck } from "lucide-react";
import { Container, PageHeader } from "@/components/design-system";

export const Route = createFileRoute("/om-oss")({
  head: () => ({
    meta: [
      { title: "Om Nova IT" },
      {
        name: "description",
        content: "Nova IT ger praktisk hjälp med datorer, nätverk, installationer och konton.",
      },
    ],
  }),
  component: About,
});

const principles = [
  {
    icon: Building2,
    title: "Praktisk hjälp",
    text: "Vi fokuserar på konkreta datorproblem, nätverk, konton och installationer som behöver fungera i vardagen.",
  },
  {
    icon: ShieldCheck,
    title: "Tydlig kommunikation",
    text: "Vi förklarar vad vi ser, vad som är värt att göra och vad som kan vänta.",
  },
  {
    icon: HeartHandshake,
    title: "Personlig support",
    text: "Tydlig hjälp som utgår från dig och det du faktiskt behöver få att fungera.",
  },
];

function About() {
  return (
    <>
      <PageHeader
        eyebrow="Om Nova IT"
        title="IT-hjälp som känns enkel att be om."
        intro="Vi hjälper privatpersoner och mindre verksamheter när datorer, nätverk, konton eller program krånglar."
      />

      <section className="nova-section">
        <Container className="py-16 sm:py-20">
          <div className="grid gap-8 md:grid-cols-3">
            {principles.map((item) => (
              <article key={item.title} className="border-t border-white/10 pt-6">
                <div className="flex items-center">
                  <span className="grid h-10 w-10 place-items-center rounded-md border border-sky-300/15 bg-sky-300/8 text-sky-200">
                    <item.icon className="h-5 w-5" />
                  </span>
                </div>
                <h2 className="mt-5 text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
