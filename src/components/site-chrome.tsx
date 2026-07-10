import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ShieldCheck, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/design-system";

const nav = [
  { to: "/", label: "Hem" },
  { to: "/tjanster", label: "Tjänster" },
  { to: "/assistent", label: "Nova-guiden" },
  { to: "/case-study", label: "Case study" },
  { to: "/faq", label: "FAQ" },
  { to: "/kontakt", label: "Kontakt" },
] as const;

const linkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/92 backdrop-blur-xl">
      <Container className="flex h-18 items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setOpen(false)}
        >
          <span className="grid h-10 w-10 place-items-center rounded-md bg-[#102724] text-emerald-200 shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-semibold tracking-[-0.02em]">Nova IT</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Fiktivt demo-case
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Huvudnavigering">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={linkClass}
              activeProps={{ className: "bg-accent text-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
          <Button asChild size="sm" className="ml-2">
            <Link to="/kontakt" search={{ service: undefined }}>
              Beskriv ärende <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </nav>

        <button
          type="button"
          aria-label={open ? "Stäng meny" : "Öppna meny"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((value) => !value)}
          className="grid h-10 w-10 place-items-center rounded-md border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>

      {open && (
        <div id="mobile-navigation" className="border-t border-border bg-background lg:hidden">
          <Container>
            <nav className="flex flex-col gap-1 py-4" aria-label="Mobilnavigering">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={linkClass}
                  activeProps={{ className: "bg-accent text-foreground" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              ))}
              <Button asChild className="mt-3">
                <Link to="/kontakt" search={{ service: undefined }} onClick={() => setOpen(false)}>
                  Beskriv ärende <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-[#102724] text-slate-200">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-emerald-300 text-slate-950">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="font-semibold text-white">Nova IT</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Ett fiktivt svenskt demo-case för tydlig IT-support, nätverk och säkerhet.
          </p>
        </div>

        <FooterColumn title="Tjänster">
          <FooterLink to="/tjanster">Alla tjänster</FooterLink>
          <FooterLink to="/kontakt">Beskriv ärende</FooterLink>
          <FooterLink to="/assistent">Nova-guiden</FooterLink>
        </FooterColumn>

        <FooterColumn title="Projektet">
          <FooterLink to="/case-study">Utvecklingsstegen</FooterLink>
          <FooterLink to="/om-oss">Om demo-caset</FooterLink>
          <FooterLink to="/faq">Vanliga frågor</FooterLink>
        </FooterColumn>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
            Demo
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Inga formuläruppgifter skickas vidare. Sidan representerar inget registrerat företag
            eller verklig supportkanal.
          </p>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Nova IT · Frontend-demo</span>
          <span>Byggd för granskning, lärande och fortsatt utveckling.</span>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
        {title}
      </h2>
      <ul className="mt-4 space-y-3 text-sm text-slate-400">{children}</ul>
    </div>
  );
}

function FooterLink({
  to,
  children,
}: {
  to: "/tjanster" | "/kontakt" | "/assistent" | "/case-study" | "/om-oss" | "/faq";
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
