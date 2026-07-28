import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Home as HomeIcon,
  Mail,
  MapPin,
  MessageCircleQuestion,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/design-system";
import { ServiceAreas } from "@/components/service-areas";
import { contactChannels, faqs, processSteps } from "@/lib/nova-data";
import { serviceRegion } from "@/lib/service-region";

const homeUrl = "https://nova-it.se/";
const socialImageUrl = "https://nova-it.se/nova-it-workspace.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nova IT – IT-hjälp i Västerort och Stockholms innerstad" },
      {
        name: "description",
        content:
          "Praktisk IT-hjälp för privatpersoner, småföretag och föreningar i Hässelby, Västerort, Bromma och Stockholms innerstad.",
      },
      {
        property: "og:title",
        content: "Nova IT – IT-hjälp i Västerort och Stockholms innerstad",
      },
      {
        property: "og:description",
        content: "Praktisk hjälp när datorer, nätverk eller konton bromsar vardagen.",
      },
      { property: "og:url", content: homeUrl },
      { property: "og:image", content: socialImageUrl },
      { name: "twitter:image", content: socialImageUrl },
    ],
    links: [{ rel: "canonical", href: homeUrl }],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <section className="relative isolate min-h-[690px] overflow-hidden bg-[#090f15] text-white sm:min-h-[760px]">
        <img
          src="/nova-it-workspace.png"
          alt="Arbetsplats med dator och nätverksutrustning"
          fetchPriority="high"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[62%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-[#090f15]/76" />
        <Container className="flex min-h-[690px] items-end py-14 sm:min-h-[760px] sm:py-20">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
              <MapPin className="h-4 w-4" /> {serviceRegion.shortLabel}
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-[0.94] tracking-normal text-balance sm:text-6xl lg:text-8xl">
              IT som bara fungerar.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
              Praktisk hjälp med datorer, nätverk, konton och program för privatpersoner, småföretag och föreningar. Tydligt, personligt och utan onödigt krångel.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-sky-400 text-slate-950 hover:bg-sky-300">
                <Link to="/kontakt" search={{ form: "request", service: undefined }}>
                  Beskriv ärende <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Link to="/tjanster">Se tjänster</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="nova-section border-b border-white/10">
        <Container className="py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">Vem behöver hjälp?</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-balance sm:text-4xl">
              Två tydliga vägar in.
            </h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <AudienceCard
              icon={HomeIcon}
              title="Privatpersoner"
              text="Hjälp med datorer, Wi-Fi, installationer, konton, skrivare och backup i vardagen."
              to="/privatpersoner"
              linkText="IT-hjälp för privatpersoner"
            />
            <AudienceCard
              icon={Building2}
              title="Småföretag och föreningar"
              text="Praktiskt stöd med arbetsplatser, nätverk, molntjänster, behörigheter och grundläggande säkerhet."
              to="/foretag-foreningar"
              linkText="IT-stöd för verksamheter"
            />
          </div>
        </Container>
      </section>

      <section className="nova-section">
        <Container className="py-16 sm:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Det vi hjälper till med</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal text-balance sm:text-4xl">
                Rätt hjälp för problemet du faktiskt har.
              </h2>
            </div>
            <Link to="/tjanster" className="text-sm font-medium text-sky-300 hover:text-sky-200">
              Se alla tjänster
            </Link>
          </div>
          <div className="pt-8">
            <ServiceAreas compact />
          </div>
        </Container>
      </section>

      <section className="nova-section">
        <Container className="grid gap-10 py-18 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="eyebrow">Så arbetar vi</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-balance sm:text-4xl">
              Mindre gissningar. Mer kontroll.
            </h2>
            <p className="mt-4 max-w-md leading-7 text-muted-foreground">
              Du ska inte behöva kunna den tekniska orsaken för att komma vidare.
            </p>
          </div>
          <ol className="grid gap-7 sm:grid-cols-3">
            {processSteps.map((step) => (
              <li key={step.title} className="border-t border-slate-700 pt-4">
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{step.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="nova-section-muted">
        <Container className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Serviceområde
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-balance sm:text-4xl">
              {serviceRegion.title}
            </h2>
          </div>
          <div className="max-w-2xl">
            <p className="leading-7 text-slate-300">{serviceRegion.description}</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">{serviceRegion.practicalNote}</p>
          </div>
        </Container>
      </section>

      <section className="nova-section">
        <Container className="py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">Att lita på</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-balance sm:text-4xl">
              Tydligt om vad du kan förvänta dig.
            </h2>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            <article className="rounded-lg border border-white/10 bg-white/5 p-6">
              <Mail className="h-5 w-5 text-sky-300" />
              <h3 className="mt-4 font-semibold">Tydlig kontaktväg</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Alla förfrågningar går till{" "}
                <a href={`mailto:${contactChannels.contact}`} className="text-sky-300 hover:text-sky-200">
                  {contactChannels.contact}
                </a>
                . Du svarar direkt på din bekräftelse.
              </p>
            </article>
            <article className="rounded-lg border border-white/10 bg-white/5 p-6">
              <ClipboardCheck className="h-5 w-5 text-sky-300" />
              <h3 className="mt-4 font-semibold">Bedömning innan åtgärd</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Ärendet ringas alltid in innan en åtgärd eller kostnad föreslås. Inget påstås utan
                att det kan styrkas.
              </p>
            </article>
            <article className="rounded-lg border border-white/10 bg-white/5 p-6">
              <ShieldCheck className="h-5 w-5 text-sky-300" />
              <h3 className="mt-4 font-semibold">Integritet</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Vad som gäller för dina uppgifter finns samlat i integritetsinformationen i
                sidfoten.
              </p>
            </article>
          </div>
        </Container>
      </section>

      <section className="nova-section-muted">
        <Container className="py-16 sm:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Vanliga frågor</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal text-balance sm:text-4xl">
                Svar innan du hör av dig.
              </h2>
            </div>
            <Link to="/faq" className="text-sm font-medium text-sky-300 hover:text-sky-200">
              Se alla frågor
            </Link>
          </div>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2">
            {faqs.slice(0, 4).map((item) => (
              <li key={item.q} className="border-t border-white/10 pt-4">
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.a}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="nova-section border-t border-white/10">
        <Container className="flex flex-col items-start gap-5 py-16 sm:flex-row sm:items-center sm:justify-between sm:py-20">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <MessageCircleQuestion className="h-4 w-4" /> Nästa steg
            </p>
            <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-normal text-balance sm:text-3xl">
              Redo att beskriva vad som krånglar?
            </h2>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link to="/kontakt" search={{ form: "request", service: undefined }}>
              Beskriv ärende <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Container>
      </section>
    </>
  );
}

function AudienceCard({
  icon: Icon,
  title,
  text,
  to,
  linkText,
}: {
  icon: typeof HomeIcon;
  title: string;
  text: string;
  to: "/privatpersoner" | "/foretag-foreningar";
  linkText: string;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-white/5 p-6">
      <Icon className="h-6 w-6 text-sky-300" />
      <h3 className="mt-5 text-2xl font-semibold">{title}</h3>
      <p className="mt-3 leading-7 text-slate-300">{text}</p>
      <Link to={to} className="mt-6 inline-flex items-center gap-2 font-medium text-sky-300 hover:text-sky-200">
        {linkText} <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
