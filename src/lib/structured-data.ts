import { contactChannels, services } from "@/lib/nova-data";
import { serviceRegion } from "@/lib/service-region";

const siteUrl = "https://nova-it.se";
const socialImageUrl = `${siteUrl}/nova-it-workspace.png`;

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
    image: socialImageUrl,
    logo: `${siteUrl}/nova-it-mark.svg`,
    email: contactChannels.contact,
    slogan: "IT som bara fungerar",
    description: serviceRegion.description,
    knowsAbout: [
      "IT-support",
      "Nätverk och Wi-Fi",
      "Datorinstallation",
      "Felsökning",
      "Säkerhet och backup",
      "Microsoft 365",
      "Google Workspace",
    ],
    areaServed: areaServed.map((name) => ({ "@type": "City", name })),
    address: {
      "@type": "PostalAddress",
      addressLocality: serviceRegion.base,
      addressRegion: "Stockholms län",
      addressCountry: "SE",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: contactChannels.contact,
      areaServed: "SE",
      availableLanguage: ["sv"],
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "IT-tjänster",
      itemListElement: services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.title,
          description: service.description,
          url: `${siteUrl}/tjanster/${service.slug}`,
        },
      })),
    },
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "Nova IT",
    url: siteUrl,
    inLanguage: "sv-SE",
    publisher: { "@id": localBusinessId },
    description: "Praktisk IT-hjälp med datorer, nätverk, konton och installationer.",
  };
}

export function buildServiceJsonLd(slug: string) {
  const service = services.find((entry) => entry.slug === slug);
  if (!service) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${siteUrl}/tjanster/${service.slug}#service`,
    name: service.title,
    description: service.description,
    serviceType: service.title,
    category: service.category,
    provider: { "@id": localBusinessId },
    areaServed: areaServed.map((name) => ({ "@type": "City", name })),
    url: `${siteUrl}/tjanster/${service.slug}`,
    image: socialImageUrl,
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

export function buildBreadcrumbJsonLd(items: readonly { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
