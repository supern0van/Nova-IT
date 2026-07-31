import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, PageHeader } from "@/components/design-system";
import { getServiceBySlug } from "@/lib/nova-data";
import { buildServiceJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/json-ld";

export const Route = createFileRoute("/tjanster/$slug")({
  head: ({ params }) => {
    const service = getServiceBySlug(params.slug);
    const title = service ? `${service.title} – Nova IT` : "Tjänst – Nova IT";
    const description =
      service?.description ?? "Läs mer om Nova IT:s tjänster och beskriv vad du behöver hjälp med.";
    const canonical = `https://nova-it.se/tjanster/${params.slug}`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: ServiceLandingPage,
});

function ServiceLandingPage() {
  const { slug } = Route.useParams();
  const service = getServiceBySlug(slug);

  if (!service) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-4xl font-semibold">Tjänsten kunde inte hittas.</h1>
        <Button asChild className="mt-6">
          <Link to="/tjanster">Se alla tjänster</Link>
        </Button>
      </Container>
    );
  }

  const serviceJsonLd = buildServiceJsonLd(service.slug);

  return (
    <>
      {serviceJsonLd && <JsonLd data={serviceJsonLd} />}
      <PageHeader eyebrow={service.category} title={service.title} intro={service.description} />

      <section className="nova-section">
        <Container className="grid gap-10 py-16 lg:grid-cols-[1fr_0.78fr] lg:items-start">
          <div>
            <p className="eyebrow">När det är dags att ta hjälp</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal text-balance">
              Vi börjar med att förstå problemet, inte med att sälja en färdig lösning.
            </h2>
            <p className="mt-5 max-w-2xl leading-7 text-slate-300">
              Beskriv vad du märker, vad som påverkas och vad du redan har provat. Nova IT bedömer
              sedan vad som är rimligt att kontrollera, åtgärda eller planera vidare.
            </p>

            <h3 className="mt-10 text-xl font-semibold">Vanliga situationer</h3>
            <ul className="mt-5 space-y-4">
              {service.examples.map((example) => (
                <li key={example} className="flex gap-3 text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
                  <span>{example}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="rounded-lg border border-white/10 bg-white/5 p-6">
            <p className="eyebrow">Målet med första kontakten</p>
            <h2 className="mt-3 text-2xl font-semibold">{service.outcome}</h2>
            <p className="mt-4 leading-7 text-slate-300">
              Du behöver inte veta den tekniska orsaken. Ett tydligt ärendeunderlag räcker för att
              vi ska kunna bedöma nästa steg utan att lova mer än underlaget tillåter.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/kontakt" search={{ form: "request", service: service.slug }}>
                Beskriv ärendet <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Link
              to="/tjanster"
              className="mt-4 block text-center text-sm text-sky-300 hover:text-sky-200"
            >
              Tillbaka till alla tjänster
            </Link>
          </aside>
        </Container>
      </section>
    </>
  );
}
