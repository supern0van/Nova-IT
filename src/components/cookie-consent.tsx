import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/design-system";
import { LegalDialogTrigger } from "@/components/legal-dialog";

const STORAGE_KEY = "nova-it-cookie-information-seen";
const OPEN_EVENT = "nova-it:open-cookie-preferences";

/**
 * CSS-variabel som speglar den här rutans FAKTISKA renderade höjd, satt på
 * `:root` medan den syns (0px annars). Låter andra fasta, bottenförankrade
 * element (just nu `SupportBotLauncher`) lägga till den i sin egen
 * `bottom`-offset i stället för att gissa en höjd i pixlar - texten radbryts
 * olika mycket beroende på viewport-bredd, så en hårdkodad siffra skulle
 * antingen lämna ett glapp eller (värre) inte räcka till.
 */
const HEIGHT_VAR = "--nova-cookie-banner-h";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Browser-only localStorage is read after hydration to avoid an SSR/client mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(localStorage.getItem(STORAGE_KEY) !== "1");
    const openInformation = () => setVisible(true);
    window.addEventListener(OPEN_EVENT, openInformation);
    return () => window.removeEventListener(OPEN_EVENT, openInformation);
  }, []);

  useEffect(() => {
    if (visible) panelRef.current?.focus();
  }, [visible]);

  // Håller HEIGHT_VAR i synk med den riktiga höjden så länge rutan är synlig
  // (textens radbrytning ändras med viewport-bredden), och nollställer den
  // både vid stängning och vid unmount - annars skulle en tidigare öppen
  // banner lämna kvar en falsk offset permanent.
  useEffect(() => {
    if (!visible) return;
    const el = panelRef.current;
    if (!el) return;

    const satt = () =>
      document.documentElement.style.setProperty(HEIGHT_VAR, `${el.offsetHeight}px`);
    satt();
    const observer = new ResizeObserver(satt);
    observer.observe(el);

    return () => {
      observer.disconnect();
      document.documentElement.style.setProperty(HEIGHT_VAR, "0px");
    };
  }, [visible]);

  if (!visible) return null;

  function stang() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  return (
    // Kompakt, sidbred rad längst ned i stället för det tidigare flytande
    // kortet (vänsterförankrat, upp till ~280px högt). Fyndet: kortet
    // täckte hero-rubriken och de två primära CTA-knapparna på
    // startsidan vid första besöket, på både mobil och desktop, tills
    // besökaren aktivt stängde det. En smal rad håller sig under ~100px
    // och lämnar CTA-knapparna synliga och klickbara.
    <section
      ref={panelRef}
      tabIndex={-1}
      aria-label="Information om kakor"
      role="region"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-slate-300 bg-white text-slate-900 shadow-[0_-8px_30px_-12px_rgb(15_23_42/0.25)] outline-none"
    >
      <Container className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-4">
        <p className="text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
          Vi använder inga kakor för annonsering eller marknadsföring. Cloudflare Web Analytics ger
          kakolös besöksstatistik och drift- och säkerhetstjänster kan använda strikt nödvändiga
          tekniker. Läs mer i vår{" "}
          <LegalDialogTrigger
            className="font-semibold text-sky-700 underline hover:text-sky-900"
            document="cookies"
          >
            cookiepolicy
          </LegalDialogTrigger>
          .
        </p>
        <button
          type="button"
          onClick={stang}
          className="min-h-10 shrink-0 rounded-md border border-sky-700 bg-sky-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        >
          Stäng
        </button>
      </Container>
    </section>
  );
}

export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className="text-left transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
    >
      Information om kakor
    </button>
  );
}
