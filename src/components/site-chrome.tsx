import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/design-system";

const nav = [
  { to: "/", label: "Hem" },
  { to: "/tjanster", label: "Tjänster" },
  { to: "/arbetssatt", label: "Så arbetar vi" },
  { to: "/faq", label: "FAQ" },
  { to: "/om-oss", label: "Om oss" },
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
          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-md shadow-sm shadow-sky-950/15">
            <img src="/nova-it-mark.svg" alt="" className="h-full w-full" />
          </span>
          <span>
            <span className="block text-base font-semibold tracking-[-0.02em]">Nova IT</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
    <footer className="mt-20 border-t border-[#243946] bg-[#111c25] text-slate-200">
      <Container className="grid overflow-hidden lg:grid-cols-[1.45fr_0.8fr_0.8fr_1fr]">
        <div className="border-b border-white/10 py-10 lg:border-r lg:pr-10">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-md border border-sky-200/20 bg-sky-300/10">
              <img src="/nova-it-mark-inverse.svg" alt="" className="h-full w-full" />
            </span>
            <span>
              <span className="block font-semibold text-white">Nova IT</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                IT som bara fungerar
              </span>
            </span>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-6 text-slate-400">
            Datorer, nätverk och säkerhet. När tekniken behöver fungera.
          </p>
        </div>

        <FooterColumn
          title="Tjänster"
          className="border-b border-white/10 py-10 lg:border-r lg:px-8"
        >
          <FooterLink to="/tjanster">Alla tjänster</FooterLink>
          <FooterLink to="/kontakt">Beskriv ärende</FooterLink>
        </FooterColumn>

        <FooterColumn
          title="Information"
          className="border-b border-white/10 py-10 lg:border-r lg:px-8"
        >
          <FooterLink to="/om-oss">Om Nova IT</FooterLink>
          <FooterLink to="/faq">Vanliga frågor</FooterLink>
        </FooterColumn>

        <FooterColumn title="Kontakt" className="py-10 lg:pl-8">
          <FooterLink to="/kontakt">Få hjälp</FooterLink>
          <FooterLink to="/arbetssatt">Så arbetar vi</FooterLink>
        </FooterColumn>
      </Container>
      <div className="border-t border-white/10 bg-black/10">
        <Container className="flex flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Nova IT. All rights reserved.</span>
          <span>IT-support · nätverk · säkerhet</span>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm text-slate-400">{children}</ul>
    </div>
  );
}

function FooterLink({
  to,
  children,
}: {
  to: "/tjanster" | "/kontakt" | "/arbetssatt" | "/om-oss" | "/faq";
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
