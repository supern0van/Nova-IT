import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Zap,
  MessageSquare,
  ShieldCheck,
  Users,
  ArrowRight,
  ClipboardList,
  Search,
  CheckCircle2,
} from "lucide-react";
import { services, faqs } from "@/lib/nova-data";
import { ServiceCard } from "@/components/service-card";

export const Route = createFileRoute("/")({
  component: Home,
});

const values = [
  { icon: Zap, title: "Snabb hjälp", text: "Svar inom en timme på vardagar." },
  { icon: MessageSquare, title: "Tydlig kommunikation", text: "Inga tekniska ord i onödan." },
  { icon: ShieldCheck, title: "Trygga lösningar", text: "Säkerhet och GDPR i grunden." },
  { icon: Users, title: "Anpassat", text: "Byggt för mindre verksamheter." },
];

const steps = [
  { icon: ClipboardList, title: "Beskriv problemet", text: "Ring, mejla eller fyll i formuläret." },
  { icon: Search, title: "Få en tydlig åtgärdsplan", text: "Vi förklarar vad som ska göras och vad det kostar." },
  { icon: CheckCircle2, title: "Vi löser och dokumenterar", text: "Åtgärdat, testat och nedskrivet — så du vet." },
];

function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              IT-support i Stockholm · svarar inom 1 timme
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Tryggt IT-stöd för dig som vill kunna jobba i lugn och ro.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Nova IT hjälper småföretag, skolor och privatpersoner med support, nätverk
              och säkerhet — utan krångel och utan onödiga tekniska ord.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/kontakt">
                  Boka support <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/tjanster">Se tjänster</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / values */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <Card key={v.title} className="border-border/70">
              <CardContent className="p-5">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                  <v.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{v.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{v.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Så här funkar det</h2>
          <p className="mt-3 text-muted-foreground">
            Tre enkla steg — från att du hör av dig till att problemet är löst.
          </p>
        </div>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-xl border border-border/70 bg-card p-6">
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                Steg {i + 1}
              </span>
              <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Featured services */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Utvalda tjänster</h2>
            <p className="mt-2 text-muted-foreground">Det vi hjälper till med varje vecka.</p>
          </div>
          <Button asChild variant="ghost">
            <Link to="/tjanster">
              Alla tjänster <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 3).map((s) => (
            <ServiceCard key={s.slug} service={s} />
          ))}
        </div>
      </section>

      {/* FAQ preview */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-3xl font-semibold tracking-tight">Vanliga frågor</h2>
        <p className="mt-2 text-muted-foreground">Snabba svar på det kunder oftast undrar.</p>
        <Accordion type="single" collapsible className="mt-6">
          {faqs.slice(0, 4).map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link to="/faq">Se alla frågor</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
