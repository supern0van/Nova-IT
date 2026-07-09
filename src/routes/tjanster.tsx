import { createFileRoute } from "@tanstack/react-router";
import { services } from "@/lib/nova-data";
import { ServiceCard } from "@/components/service-card";

export const Route = createFileRoute("/tjanster")({
  head: () => ({
    meta: [
      { title: "Tjänster – Nova IT" },
      {
        name: "description",
        content:
          "IT-support, nätverk, datorinstallation, felsökning, säkerhet och Microsoft 365 – allt du behöver för en fungerande vardag.",
      },
      { property: "og:title", content: "Tjänster – Nova IT" },
      {
        property: "og:description",
        content: "Se allt Nova IT hjälper till med — från Wi-Fi till backup.",
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">Våra tjänster</h1>
        <p className="mt-3 text-muted-foreground">
          Vi hjälper till med hela IT-vardagen — från snabba supportärenden till
          strategiska säkerhets- och nätverksuppdrag. Alla priser är transparenta
          och du får alltid ett tydligt förslag innan vi börjar.
        </p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s.slug} service={s} />
        ))}
      </div>
    </section>
  );
}
