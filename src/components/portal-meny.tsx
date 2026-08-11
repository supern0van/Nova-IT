import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Eye, EyeOff, LoaderCircle, Lock, Ticket } from "lucide-react";

import { cn } from "@/lib/utils";
import { KUNDPORTAL_ORIGIN } from "@/lib/security-policy";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { getKundportalTurnstileSiteKey } from "@/features/portal/portal-turnstile-server";

// Egen action skiljer den här inloggningen från kontaktformulärets Turnstile-
// verifiering (samma widget, se Nova-IT-Kundportal: lib/turnstile-server.ts).
const TURNSTILE_ACTION = "portal_header_logga_in";

// Inloggningen postas som ett vanligt HTML-formulär (top-level POST) direkt
// till kundportalens egen origin. Lösenordet passerar därför aldrig
// nova-it.se:s server, och kundportalen sätter sina egna host-bundna
// sessionskakor innan den skickar kunden vidare till returvägen nedan.
// Endpointen har en egen allowlist för nova-it.se-origins och rate limiting;
// se Nova-IT-Kundportal: app/api/kund/logga-in-form/route.ts.
const KUNDPORTAL_BAS = KUNDPORTAL_ORIGIN;
const KUNDPORTAL_LOGGA_IN_FORM = `${KUNDPORTAL_BAS}/api/kund/logga-in-form`;
const KUNDPORTAL_GLOMT_LOSENORD = `${KUNDPORTAL_BAS}/glomt-losenord`;

// Dit kunden landar direkt efter lyckad inloggning - ingen mellanlandning på
// en inloggningssida. Måste vara en relativ path; kundportalen avvisar allt
// annat (internReturvag i samma route).
const RETURVAG_EFTER_INLOGGNING = "/mina-arenden";

/**
 * Portal-ingången i sidhuvudet. Öppnar en panel med inloggning direkt i
 * headern - ärendenummer, lösenord och "Glömt lösenord?".
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
  const [visaLosenord, setVisaLosenord] = useState(false);
  const [skickar, setSkickar] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [inloggningsfel, setInloggningsfel] = useState<string | null>(null);
  const behallare = useRef<HTMLDivElement>(null);
  const knapp = useRef<HTMLButtonElement>(null);
  const arendenummerFalt = useRef<HTMLInputElement>(null);
  const panelId = useId();
  const arendenummerId = useId();
  const losenordId = useId();

  const stangPortal = useCallback(() => {
    setOpen(false);
    setTurnstileToken(null);
    setInloggningsfel(null);
    setSkickar(false);
  }, []);

  // Escape stänger och lämnar tillbaka fokus till knappen, så att
  // tangentbordsnavigering inte tappar sin plats i sidhuvudet.
  useEffect(() => {
    if (!open) return;

    const vidTangent = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      stangPortal();
      knapp.current?.focus();
    };

    const vidKlickUtanfor = (event: MouseEvent) => {
      if (behallare.current?.contains(event.target as Node)) return;
      stangPortal();
    };

    document.addEventListener("keydown", vidTangent);
    document.addEventListener("mousedown", vidKlickUtanfor);

    return () => {
      document.removeEventListener("keydown", vidTangent);
      document.removeEventListener("mousedown", vidKlickUtanfor);
    };
  }, [open, stangPortal]);

  // Flyttar tangentbordsfokus direkt till Ärendenummer-fältet när panelen
  // öppnas, så att både tangentbords- och skärmläsaranvändare hamnar rätt
  // utan att behöva tabba dit manuellt.
  useEffect(() => {
    if (!open) return;
    arendenummerFalt.current?.focus();
  }, [open]);

  const arMobil = variant === "mobil";

  return (
    <div ref={behallare} className={cn("relative", arMobil && "w-full", className)}>
      <button
        ref={knapp}
        type="button"
        onClick={() => {
          if (open) {
            stangPortal();
          } else {
            setOpen(true);
          }
        }}
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

        {/* Inget target-attribut: formuläret navigerar i samma flik, så
            kunden landar inloggad på sin ärendesida utan att en ny flik
            öppnas. */}
        <form
          action={KUNDPORTAL_LOGGA_IN_FORM}
          method="POST"
          onSubmit={(event) => {
            if (!turnstileToken) {
              event.preventDefault();
              setInloggningsfel(
                "Säkerhetskontrollen är inte klar ännu. Vänta ett ögonblick och försök igen.",
              );
              return;
            }
            setInloggningsfel(null);
            setSkickar(true);
          }}
          className="mt-4"
        >
          <input type="hidden" name="returnTo" value={RETURVAG_EFTER_INLOGGNING} />

          <label htmlFor={arendenummerId} className="block text-[13px] font-medium text-slate-200">
            Ärendenummer
          </label>
          <div className="relative mt-1.5">
            <Ticket
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              ref={arendenummerFalt}
              id={arendenummerId}
              name="arendenummer"
              type="text"
              required
              autoComplete="username"
              className="min-h-11 w-full rounded-md border border-white/15 bg-[#070d14] pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus-visible:border-sky-300 focus-visible:ring-2 focus-visible:ring-sky-300/30"
            />
          </div>

          <label htmlFor={losenordId} className="mt-3 block text-[13px] font-medium text-slate-200">
            Lösenord
          </label>
          <div className="relative mt-1.5">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id={losenordId}
              name="losenord"
              type={visaLosenord ? "text" : "password"}
              required
              autoComplete="current-password"
              className="min-h-11 w-full rounded-md border border-white/15 bg-[#070d14] pl-9 pr-11 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus-visible:border-sky-300 focus-visible:ring-2 focus-visible:ring-sky-300/30"
            />
            <button
              type="button"
              onClick={() => setVisaLosenord((value) => !value)}
              aria-label={visaLosenord ? "Dölj lösenord" : "Visa lösenord"}
              aria-pressed={visaLosenord}
              className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-slate-500 transition-colors hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              {visaLosenord ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={skickar}
            aria-busy={skickar}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-sky-500 px-4 text-sm font-semibold text-[#04101c] transition-colors hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c141d] disabled:cursor-wait disabled:opacity-75"
          >
            {skickar && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {skickar ? "Loggar in…" : "Logga in"}
          </button>

          {inloggningsfel && (
            <p role="alert" className="mt-2 text-[13px] leading-5 text-rose-300">
              {inloggningsfel}
            </p>
          )}

          <a
            href={KUNDPORTAL_GLOMT_LOSENORD}
            onClick={() => {
              stangPortal();
              onNavigate?.();
            }}
            className="mt-1 flex min-h-11 items-center justify-center rounded-md text-[13px] font-medium text-sky-300 transition-colors hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          >
            Glömt lösenord?
          </a>

          {/* Renderas bara medan panelen är öppen - dels för att slippa
              montera widgeten i en dold (hidden) behållare, dels för att
              slippa ladda Turnstile-scriptet för besökare som aldrig öppnar
              Portal. Token hamnar automatiskt i ett dolt cf-turnstile-
              response-fält i formuläret ovan. Token hålls även i state så
              att formuläret aldrig kan fastna i laddningsläge innan
              säkerhetskontrollen är klar. */}
          {open && (
            <div className="mt-1 border-t border-white/8 pt-2 opacity-75">
              <TurnstileWidget
                action={TURNSTILE_ACTION}
                getSiteKey={getKundportalTurnstileSiteKey}
                onToken={(token) => {
                  setTurnstileToken(token);
                  if (token) setInloggningsfel(null);
                }}
                diskret
              />
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
