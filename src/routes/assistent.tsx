import { Link, createFileRoute } from "@tanstack/react-router";
import { Container, PageHeader } from "@/components/design-system";
import { SupportChat } from "@/features/support/SupportChat";
import { SUPPORT_ASSISTANT_IS_ONLINE } from "@/features/support/support-availability";

const assistentUrl = "https://nova-it.se/assistent";
const assistentTitle = SUPPORT_ASSISTANT_IS_ONLINE
  ? "Förbered ditt IT-ärende – Nova IT"
  : "Ärendeguiden är offline – Nova IT";
const assistentDescription = SUPPORT_ASSISTANT_IS_ONLINE
  ? "Beskriv vad som krånglar och få hjälp att samla rätt underlag innan du kontaktar Nova IT."
  : "Nova IT:s automatiska ärendeguide är tillfälligt avstängd. Kontakta oss via kontaktformuläret.";
const socialImageUrl = "https://nova-it.se/nova-it-workspace.png";

export const Route = createFileRoute("/assistent")({
  head: () => ({
    meta: [
      { title: assistentTitle },
      { name: "description", content: assistentDescription },
      { property: "og:title", content: assistentTitle },
      { property: "og:description", content: assistentDescription },
      { property: "og:url", content: assistentUrl },
      { property: "og:image", content: socialImageUrl },
      { name: "twitter:title", content: assistentTitle },
      { name: "twitter:description", content: assistentDescription },
      { name: "twitter:image", content: socialImageUrl },
      ...(!SUPPORT_ASSISTANT_IS_ONLINE
        ? [{ name: "robots", content: "noindex, follow" }]
        : []),
    ],
    links: [{ rel: "canonical", href: assistentUrl }],
  }),
  component: AssistantPage,
});

function AssistantPage() {
  if (!SUPPORT_ASSISTANT_IS_ONLINE) {
    return (
      <>
        <PageHeader
          eyebrow="Ärendeguiden är offline"
          title="Kontakta oss så hjälper vi dig personligen."
          intro="Den automatiska ärendeguiden är tillfälligt avstängd. Du kan fortfarande skicka in ditt ärende via kontaktformuläret."
        />
        <section className="nova-section">
          <Container className="py-10 sm:py-14">
            <Link
              to="/kontakt"
              search={{ form: "request", handoff: undefined, service: undefined }}
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Gå till kontaktformuläret
            </Link>
          </Container>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Automatisk ärendeguide"
        title="Fråga vad som helst. Vi svarar direkt."
        intro="Chatta fritt om vad som krånglar eller vad Nova IT kan hjälpa till med. Guiden svarar utifrån våra faktiska tjänster - den felsöker inte och ersätter inte en tekniker."
      />
      <section className="nova-section">
        <Container className="py-10 sm:py-14">
          <SupportChat />
        </Container>
      </section>
    </>
  );
}
