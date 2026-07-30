import { contactChannels, services } from "@/lib/nova-data";
import { serviceRegion } from "@/lib/service-region";

const siteUrl = "https://nova-it.se";

// Delas av LocalBusiness (index.tsx) och Service (tjanster.$slug.tsx) som
// provider, så de syftar på samma organisation i strukturerad data.
export const localBusinessId = `${siteUrl}/#business`;

const areaServed = [
  "Hässelby",
  "Västerort",
  "Bromma",
  "Järfälla",
  "Jakobsberg",
  "Sundbyberg",
  "Solna",
  "Stockholms innerstad",
];

export function buildLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": localBusinessId,
    name: "Nova IT",
    url: siteUrl,
    image: `${siteUrl}/nova-it-workspace.png`,
    email: contactChannels.contact,
    description: serviceRegion.description,
    areaServed: areaServed.map((name) => ({ "@type": "City", name })),
    address: {
      "@type": "PostalAddress",
      addressLocality: serviceRegion.base,
      addressRegion: "Stockholms län",
      addressCountry: "SE",
    },
  };
}

export function buildServiceJsonLd(slug: string) {
  const service = services.find((entry) => entry.slug === slug);
  if (!service) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    provider: { "@id": localBusinessId },
    areaServed: areaServed.map((name) => ({ "@type": "City", name })),
    url: `${siteUrl}/tjanster/${service.slug}`,
  };
}

export function buildFaqPageJsonLd(faqs: readonly { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}
