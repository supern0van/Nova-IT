import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight, Mail, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/design-system";
import { contactChannels } from "@/lib/nova-data";
import { LegalDialogTrigger } from "@/components/legal-dialog";
import { CookiePreferencesButton } from "@/components/cookie-consent";

const nav = [
  { to: "/", label: "Hem" },
  { to: "/privatpersoner", label: "Privatpersoner" },
  { to: "/foretag-foreningar", label: "Företag & föreningar" },
  { to: "/tjanster", label: "Tjänster" },
  { to: "/arbetssatt", label: "Så arbetar vi" },
  { to: "/faq", label: "FAQ" },
  { to: "/om-oss", label: "Om oss" },
] as const;

const footerServiceColumns = [
  ["IT-support och helpdesk", "Felsökning", "Datorinstallation"],
  ["Datorservice och uppgradering", "Nätverk och Wi‑Fi"],
  ["Säkerhet och backup", "Microsoft 365 och Google Workspace"],
];

const linkClass =
  "whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 xl:px-3";

const KUNDPORTAL_URL = "https://kundportal.nova-it.se/logga-in";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-[60] w-full bg-[#090f15]/94 text-white backdrop-blur-xl">
        <Container className="flex h-18 items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setOpen(false)}
          >
            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-md shadow-sm shadow-sky-950/15">
              <img src="/nova-it-mark.svg" alt="" className="h-full w-full" />
            </span>
            <span>
              <span className="block text-base font-semibold tracking-normal">Nova IT</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                IT-support och nätverk
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Huvudnavigering">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={linkClass}
                activeProps={{ className: "bg-white/10 text-white" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
            <Button asChild size="sm" className="ml-1.5 whitespace-nowrap">
              <Link to="/kontakt" search={{ form: "request" }}>
                Kontakta oss <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="ml-1.5 whitespace-nowrap border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <a href={KUNDPORTAL_URL} target="_blank" rel="noopener noreferrer">
                Kundportal <LogIn className="h-4 w-4" />
              </a>
            </Button>
          </nav>

          <button
            type="button"
            aria-label={open ? "Stäng meny" : "Öppna meny"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-md border border-white/15 bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </Container>
      </header>

      {open && (
        <div
          id="mobile-navigation"
          className="fixed inset-x-0 top-18 z-50 border-t border-white/10 bg-[#090f15] text-white shadow-2xl shadow-black/50 lg:hidden"
        >
          <Container className="py-4">
            <nav className="flex flex-col" aria-label="Mobilnavigering">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="border-b border-white/10 py-4 text-base font-medium text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  activeProps={{ className: "border-sky-300 text-sky-200" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              ))}
              <Button asChild className="mt-5">
                <Link to="/kontakt" search={{ form: "request" }} onClick={() => setOpen(false)}>
                  Kontakta oss <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="mt-3 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <a href={KUNDPORTAL_URL} target="_blank" rel="noopener noreferrer">
                  Kundportal <LogIn className="h-4 w-4" />
                </a>
              </Button>
            </nav>
          </Container>
        </div>
      )}
    </>
  );
}

export function SiteFooter() {
  return (
    <footer id="site-footer" className="bg-[#111c25] text-slate-200">
      <Container className="grid overflow-hidden lg:grid-cols-[1.1fr_2fr_0.8fr_0.9fr]">
        <div className="border-b border-white/10 py-7 lg:border-b-0 lg:pr-10">
          <Link
            to="/"
            className="flex w-fit items-center gap-3 rounded-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          >
            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-md border border-sky-200/20 bg-sky-300/10">
              <img src="/nova-it-mark-inverse.svg" alt="" className="h-full w-full" />
            </span>
            <span>
              <span className="block font-semibold text-white">Nova IT</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                IT som bara fungerar
              </span>
            </span>
          </Link>
          <p className="mt-5 max-w-xs text-[13px] leading-5 text-slate-400">
            Praktisk hjälp med datorer, nätverk och konton när tekniken behöver fungera.
          </p>
        </div>

        <div className="border-b border-white/10 py-7 lg:border-x lg:border-b-0 lg:px-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">
            <Link
              to="/tjanster"
              className="transition-colors hover:text-white focus-visible:text-white"
            >
              Tjänster
            </Link>
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-x-6 text-[13px] sm:grid-cols-3">
            {footerServiceColumns.map((services, index) => (
              <ul key={index} className="space-y-1.5">
                {services.map((service) => (
                  <li key={service} className="leading-5 text-slate-400">
                    {service}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        <FooterColumn
          title="Information"
          className="border-b border-white/10 py-7 lg:border-b-0 lg:px-10"
        >
          <FooterLink to="/om-oss">Om Nova IT</FooterLink>
          <FooterLink to="/faq">Vanliga frågor</FooterLink>
          <FooterLink to="/assistent">Förbered ditt ärende</FooterLink>
        </FooterColumn>

        <FooterColumn title="Kontaktuppgifter" className="py-7 lg:pl-10">
          <li>
            <a
              href={`mailto:${contactChannels.contact}`}
              className="inline-flex items-center gap-2 transition-colors hover:text-sky-200 focus-visible:text-sky-200"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              {contactChannels.contact}
            </a>
          </li>
        </FooterColumn>
      </Container>
      <div className="border-t border-white/10 bg-black/10">
        <Container className="flex flex-col gap-3 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Nova IT. Alla rättigheter förbehållna.</span>
          <nav aria-label="Juridisk information" className="flex flex-wrap gap-x-4 gap-y-2">
            <LegalDialogTrigger
              document="privacy"
              className="transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              Integritet
            </LegalDialogTrigger>
            <LegalDialogTrigger
              document="cookies"
              className="transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              Kakor
            </LegalDialogTrigger>
            <CookiePreferencesButton />
            <LegalDialogTrigger
              document="terms"
              className="transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              Webbplatsvillkor
            </LegalDialogTrigger>
          </nav>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
  className,
  listClassName,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  listClassName?: string;
}) {
  return (
    <div className={className}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">{title}</h2>
      <ul className={listClassName ?? "mt-4 space-y-2 text-[13px] leading-5 text-slate-400"}>
        {children}
      </ul>
    </div>
  );
}

function FooterLink({
  to,
  children,
}: {
  to: "/tjanster" | "/arbetssatt" | "/om-oss" | "/faq" | "/assistent";
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link to={to} className="transition-colors hover:text-white focus-visible:text-white">
        {children}
      </Link>
    </li>
  );
}
