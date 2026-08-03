import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Lock, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

// Kundportalen ligger på egen origin med eget CSRF- och sessionsskydd.
// Inloggningen sker därför alltid där, aldrig här - den här panelen är en
// ingång som förklarar vart man är på väg, inte ett inloggningsformulär.
// Se docs/changes/NOVA-0028-portal-ingang.md för avvägningen.
const KUNDPORTAL_BAS = "https://kundportal.nova-it.se";
const KUNDPORTAL_INLOGGNING = `${KUNDPORTAL_BAS}/logga-in`;
const KUNDPORTAL_GLOMT_LOSENORD = `${KUNDPORTAL_BAS}/glomt-losenord`;

/**
 * Portal-ingången i sidhuvudet. Öppnar en panel med kort sammanhang och
 * vidarebefordran till kundportalens egen inloggning.
 *
 * Interna roller har medvetet ingen synlig ingång här: adminportalen ligger
 * bakom Cloudflare Access på egen subdomän och ska inte exponeras som ett
 * publikt val.
 */
export function PortalMeny({
  className,
  variant = "desktop",
  onNavigate,
}: {
  className?: string;
  variant?: "desktop" | "mobil";
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const behallare = useRef<HTMLDivElement>(null);
  const knapp = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // Escape stänger och lämnar tillbaka fokus till knappen, så att
  // tangentbordsnavigering inte tappar sin plats i sidhuvudet.
  useEffect(() => {
    if (!open) return;

    const vidTangent = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      knapp.current?.focus();
    };

    const vidKlickUtanfor = (event: MouseEvent) => {
      if (behallare.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", vidTangent);
    document.addEventListener("mousedown", vidKlickUtanfor);

    return () => {
      document.removeEventListener("keydown", vidTangent);
      document.removeEventListener("mousedown", vidKlickUtanfor);
    };
  }, [open]);

  const arMobil = variant === "mobil";

  return (
    <div ref={behallare} className={cn("relative", arMobil && "w-full", className)}>
      <button
        ref={knapp}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
          arMobil ? "min-h-11 w-full px-4" : "h-8 px-3",
          open
            ? "border-sky-300/50 bg-sky-300/12 text-white"
            : "border-white/20 bg-transparent text-white hover:bg-white/10",
        )}
      >
        <Lock className="h-4 w-4" aria-hidden="true" />
        Portal
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className={cn(
          "rounded-lg border border-white/12 bg-[#0c141d] p-5 text-left shadow-2xl shadow-black/60",
          arMobil
            ? "mt-3 w-full"
            : "absolute right-0 top-[calc(100%+0.625rem)] z-10 w-[min(20rem,calc(100vw-2rem))]",
        )}
      >
        <p className="text-sm font-semibold text-white">Kundportal</p>
        <p className="mt-1.5 text-[13px] leading-5 text-slate-400">
          Följ dina ärenden, se status och svara Nova IT direkt i portalen.
        </p>

        <a
          href={KUNDPORTAL_INLOGGNING}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            setOpen(false);
            onNavigate?.();
          }}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-sky-500 px-4 text-sm font-semibold text-[#04101c] transition-colors hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c141d]"
        >
          Logga in
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>

        <a
          href={KUNDPORTAL_GLOMT_LOSENORD}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            setOpen(false);
            onNavigate?.();
          }}
          className="mt-1 flex min-h-11 items-center justify-center rounded-md text-[13px] font-medium text-sky-300 transition-colors hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          Glömt lösenord?
        </a>

        <p className="mt-4 flex items-center justify-center gap-1.5 border-t border-white/8 pt-3.5 text-[11px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Säker anslutning · Nova IT
        </p>
      </div>
    </div>
  );
}
