import { useEffect, useRef, useState } from "react";
import { LegalDialogTrigger } from "@/components/legal-dialog";

const STORAGE_KEY = "nova-it-cookie-consent";
const OPEN_EVENT = "nova-it:open-cookie-preferences";

type Consent = {
  necessary: true;
  statistics: boolean;
  marketing: boolean;
};

const initialConsent: Consent = { necessary: true, statistics: false, marketing: false };

function readConsent(): Consent | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<Consent>;
    return {
      necessary: true,
      statistics: parsed.statistics === true,
      marketing: parsed.marketing === true,
    };
  } catch {
    return null;
  }
}

function saveConsent(consent: Consent) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent("nova-it:consent-changed", { detail: consent }));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [statistics, setStatistics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const rubrikRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (visible) rubrikRef.current?.focus();
  }, [visible]);

  useEffect(() => {
    const stored = readConsent();
    if (stored) {
      // Browser-only localStorage is read after hydration to avoid an SSR/client mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatistics(stored.statistics);
      setMarketing(stored.marketing);
    } else {
      setVisible(true);
    }

    const openPreferences = () => {
      const current = readConsent() ?? initialConsent;
      setStatistics(current.statistics);
      setMarketing(current.marketing);
      setVisible(true);
    };

    window.addEventListener(OPEN_EVENT, openPreferences);
    return () => window.removeEventListener(OPEN_EVENT, openPreferences);
  }, []);

  if (!visible) return null;

  const choose = (consent: Consent) => {
    saveConsent(consent);
    setVisible(false);
  };

  return (
    <section
      aria-labelledby="cookie-consent-title"
      role="region"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-[70] rounded-xl border border-slate-300 bg-white p-5 text-slate-900 shadow-2xl shadow-slate-950/20 sm:inset-x-auto sm:left-6 sm:max-w-2xl sm:p-6"
    >
      <h2
        id="cookie-consent-title"
        ref={rubrikRef}
        tabIndex={-1}
        className="text-lg font-semibold outline-none"
      >
        Hantera kakor
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Vi använder nödvändiga tekniker för drift och säkerhet. Statistik och marknadsföring är
        valfria och aktiveras bara om du väljer dem. Läs mer i vår{" "}
        <LegalDialogTrigger
          className="font-semibold text-sky-700 underline hover:text-sky-900"
          document="cookies"
        >
          cookiepolicy
        </LegalDialogTrigger>
        .
      </p>

      <fieldset className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm">
        <legend className="sr-only">Valfria kategorier</legend>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={statistics}
            onChange={(event) => setStatistics(event.target.checked)}
          />
          Statistik
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={marketing}
            onChange={(event) => setMarketing(event.target.checked)}
          />
          Marknadsföring
        </label>
      </fieldset>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => choose({ necessary: true, statistics: false, marketing: false })}
          className="min-h-11 rounded-md border border-sky-700 bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        >
          Neka alla
        </button>
        <button
          type="button"
          onClick={() => choose({ necessary: true, statistics, marketing })}
          className="min-h-11 rounded-md border border-sky-700 bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        >
          Spara val
        </button>
        <button
          type="button"
          onClick={() => choose({ necessary: true, statistics: true, marketing: true })}
          className="min-h-11 rounded-md border border-sky-700 bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        >
          Godkänn alla
        </button>
      </div>
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
      Hantera kakor
    </button>
  );
}
