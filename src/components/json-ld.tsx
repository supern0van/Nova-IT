// Renderar ett <script type="application/ld+json">-block. Görs i JSX (inte via
// head()-exportens meta/links-listor, som bara känner till <meta>/<link>-taggar)
// så att TanStack Starts SSR ändå får ut det i den renderade sidan.
export function JsonLd({ data }: { data: object }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
