import { useEffect, useRef, useState } from "react";
import { LegalDialogTrigger } from "@/components/legal-dialog";

const STORAGE_KEY = "nova-it-cookie-information-seen";
const OPEN_EVENT = "nova-it:open-cookie-preferences";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const rubrikRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Browser-only localStorage is read after hydration to avoid an SSR/client mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(localStorage.getItem(STORAGE_KEY) !== "1");
    const openInformation = () => setVisible(true);
    window.addEventListener(OPEN_EVENT, openInformation);
    return () => window.removeEventListener(OPEN_EVENT, openInformation);
  }, []);

  useEffect(() => {
    if (visible) rubrikRef.current?.focus();
  }, [visible]);

  if (!visible) return null;

  function stang() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  return (
    <section
      aria-labelledby="cookie-information-title"
      role="region"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-[70] rounded-xl border border-slate-300 bg-white p-5 text-slate-900 shadow-2xl shadow-slate-950/20 sm:inset-x-auto sm:left-6 sm:max-w-2xl sm:p-6"
    >
      <h2
        id="cookie-information-title"
        ref={rubrikRef}
        tabIndex={-1}
        className="text-lg font-semibold outline-none"
      >
        Information om kakor
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
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
        className="mt-5 min-h-11 rounded-md border border-sky-700 bg-sky-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
      >
        Stäng
      </button>
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
