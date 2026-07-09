import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Heart, Users } from "lucide-react";

export const Route = createFileRoute("/om-oss")({
  head: () => ({
    meta: [
      { title: "Om oss – Nova IT" },
      {
        name: "description",
        content:
          "Nova IT är ett litet Stockholmsbaserat IT-företag som hjälper mindre verksamheter med support, nätverk och säkerhet.",
      },
      { property: "og:title", content: "Om Nova IT" },
      {
        property: "og:description",
        content: "Ett litet, kompetent IT-team med fokus på tydlighet och trygghet.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Om Nova IT</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Nova IT startades 2019 i Stockholm av två tekniker som var trötta på att
        se småföretag betala dyrt för IT som ändå inte fungerade. Idag är vi ett team
        på fem personer som hjälper skolor, mindre företag och privatpersoner med
        allt från vardagssupport till nätverk och säkerhet.
      </p>
      <p className="mt-4 text-muted-foreground">
        Vi tror på tydlighet: du ska förstå vad vi gör, varför vi gör det och vad
        det kostar. Vi tror på trygghet: dina system ska vara säkra och dina
        data ska finnas kvar, även när något går fel. Och vi tror på att göra
        färre saker riktigt bra, snarare än många saker halvbra.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Users, title: "5 tekniker", text: "Med olika specialiteter." },
          { icon: Building2, title: "80+ kunder", text: "I Storstockholm." },
          { icon: Heart, title: "Sedan 2019", text: "Fortfarande självständiga." },
        ].map((s) => (
          <Card key={s.title}>
            <CardContent className="p-5">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
