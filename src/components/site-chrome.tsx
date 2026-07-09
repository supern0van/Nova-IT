import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { contactChannels, demoNotice } from "@/lib/nova-data";

const nav = [
  { to: "/", label: "Hem" },
  { to: "/tjanster", label: "Tjänster" },
  { to: "/assistent", label: "Supportguide" },
  { to: "/faq", label: "FAQ" },
  { to: "/om-oss", label: "Om oss" },
  { to: "/kontakt", label: "Kontakt" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Nova IT</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "text-foreground bg-accent" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
          <Button asChild size="sm" className="ml-2">
            <Link to="/kontakt">Beskriv ärende</Link>
          </Button>
        </nav>

        <button
          type="button"
          aria-label={open ? "Stäng meny" : "Öppna meny"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-md border border-border md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                activeProps={{ className: "text-foreground bg-accent" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
            <Button asChild size="sm" className="mt-2">
              <Link to="/kontakt" onClick={() => setOpen(false)}>
                Beskriv ärende
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="font-semibold">Nova IT</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Fiktiv svensk IT-supportwebb för mindre företag, skolor och privatpersoner.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Tjänster</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/tjanster" className="hover:text-foreground">
                IT-support
              </Link>
            </li>
            <li>
              <Link to="/tjanster" className="hover:text-foreground">
                Nätverk & Wi-Fi
              </Link>
            </li>
            <li>
              <Link to="/tjanster" className="hover:text-foreground">
                Säkerhet & backup
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Företag</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/om-oss" className="hover:text-foreground">
                Om oss
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-foreground">
                Vanliga frågor
              </Link>
            </li>
            <li>
              <Link to="/kontakt" className="hover:text-foreground">
                Kontakt
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Demo-kontakt</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>{contactChannels.email}</li>
            <li>{contactChannels.availability}</li>
            <li>Formuläret är frontend-only</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 px-4 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Nova IT · {demoNotice}
      </div>
    </footer>
  );
}
