// Copyright (c) 2026 Nova IT. All rights reserved.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../integrations/lovable/error-reporting";
import { SiteHeader, SiteFooter } from "../components/site-chrome";
import { SupportBotLauncher } from "../features/support/SupportBotLauncher";
import { LegalDialogProvider } from "../components/legal-dialog";

const siteUrl = "https://nova-it.se";
const socialImageUrl = `${siteUrl}/nova-it-workspace.png`;

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Nova IT",
  url: siteUrl,
  logo: `${siteUrl}/nova-it-mark.svg`,
};

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Nova IT",
  url: siteUrl,
  inLanguage: "sv-SE",
};

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Sidan hittades inte</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Länken kan vara felstavad eller så har sidan flyttats.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Till startsidan
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Sidan kunde inte laddas
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Något gick fel i vyn. Försök igen eller gå tillbaka till startsidan.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Försök igen
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Till startsidan
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nova IT – IT som bara fungerar" },
      {
        name: "description",
        content:
          "Praktisk hjälp med datorer, nätverk, installationer, konton och program som krånglar.",
      },
      { name: "author", content: "Nova IT" },
      { property: "og:locale", content: "sv_SE" },
      { property: "og:site_name", content: "Nova IT" },
      { property: "og:title", content: "Nova IT – IT som bara fungerar" },
      {
        property: "og:description",
        content: "Praktisk IT-hjälp när datorer, Wi-Fi, konton eller program behöver fungera.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: siteUrl },
      { property: "og:image", content: socialImageUrl },
      { property: "og:image:alt", content: "Nova IT – praktisk IT-hjälp" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Nova IT – IT som bara fungerar" },
      {
        name: "twitter:description",
        content: "Praktisk IT-hjälp när datorer, Wi-Fi, konton eller program behöver fungera.",
      },
      { name: "twitter:image", content: socialImageUrl },
      { name: "theme-color", content: "#172033" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/nova-it-mark.svg", type: "image/svg+xml" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LegalDialogProvider>
        <div className="flex min-h-screen flex-col bg-background text-foreground">
          <a
            href="#main-content"
            className="sr-only fixed left-4 top-4 z-50 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only"
          >
            Hoppa till innehåll
          </a>
          <SiteHeader />
          <main id="main-content" className="flex-1">
            <Outlet />
          </main>
          <SiteFooter />
          <SupportBotLauncher />
        </div>
      </LegalDialogProvider>
    </QueryClientProvider>
  );
}
