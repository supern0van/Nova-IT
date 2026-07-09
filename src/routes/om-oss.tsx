import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, HeartHandshake, ShieldCheck } from "lucide-react";
import { demoNotice } from "@/lib/nova-data";

export const Route = createFileRoute("/om-oss")({
  head: () => ({
    meta: [
      { title: "Om Nova IT – fiktivt demoexempel" },
      {
        name: "description",
        content:
          "Nova IT är ett fiktivt svenskt IT-supportexempel med tydliga avgränsningar, ärlig copy och trovärdig tjänstepresentation.",
      },
      { property: "og:title", content: "Om Nova IT" },
      {
        property: "og:description",
        content:
          "Ett fiktivt exempel på hur en svensk IT-supportsajt kan kännas mer polerad och trovärdig.",
      },
    ],
  }),
  component: About,
});

const principles = [
  {
    icon: Building2,
    title: "Fiktivt bolag",
    text: "Ingen adress, inget organisationsnummer och inga kundsiffror som kan misstas för verkliga.",
  },
  {
    icon: ShieldCheck,
    title: "Säker copy",
    text: "Tjänster och formulär beskriver ett möjligt arbetssätt utan att lova verklig drift.",
  },
  {
    icon: HeartHandshake,
    title: "Svensk tonalitet",
    text: "Rak, lugn och praktisk text för småföretag, skolor och privatpersoner.",
  },
];

function About() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <p className="text-sm font-medium uppercase text-muted-foreground">Om Nova IT</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">
        Ett fiktivt IT-supportbolag med verklighetstrogen struktur
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">{demoNotice}</p>
      <p className="mt-4 text-muted-foreground">
        Syftet är att visa hur en Lovable-export kan göras mer kundredo: tydligare tjänster, mer
        svensk ton, bättre formulär och ett ärligt stödflöde utan påhittade företagsuppgifter.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {principles.map((item) => (
          <Card key={item.title} className="border-border/70">
            <CardContent className="p-5">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-base font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
