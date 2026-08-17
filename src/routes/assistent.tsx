import { createFileRoute } from "@tanstack/react-router";
import { Container, PageHeader } from "@/components/design-system";
import { SupportChat } from "@/features/support/SupportChat";

const assistentUrl = "https://nova-it.se/assistent";
const assistentTitle = "Förbered ditt IT-ärende – Nova IT";
const assistentDescription =
  "Beskriv vad som krånglar och få hjälp att samla rätt underlag innan du kontaktar Nova IT.";
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
    ],
    links: [{ rel: "canonical", href: assistentUrl }],
  }),
  component: AssistantPage,
});

function AssistantPage() {
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
