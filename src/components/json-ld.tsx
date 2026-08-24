// Renderar ett <script type="application/ld+json">-block. Görs i JSX (inte via
// head()-exportens meta/links-listor, som bara känner till <meta>/<link>-taggar)
// så att TanStack Starts SSR ändå får ut det i den renderade sidan.
//
// Alla nuvarande anropsplatser (buildWebSiteJsonLd/buildBreadcrumbJsonLd/
// buildServiceJsonLd/buildFaqPageJsonLd, se src/lib/structured-data.ts) matar
// in statiskt, hårdkodat sidinnehåll - ingen aktiv exploateringsväg idag. Men
// escapningen görs ändå en gång för alla här, inte hos varje anropare: den
// dag någon bygger JSON-LD från t.ex. en fritext-FAQ öppnar en oescapad
// </script>-sekvens i innehållet en lagrad XSS-väg rakt in i sidan.
export function sakerJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: sakerJsonLd(data) }} />;
}
