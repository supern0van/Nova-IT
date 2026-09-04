/**
 * Svenska etiketter för `/arendestatus` - speglar ordagrant kundportalens
 * egna `lib/arende-status.ts` (`arendeStatusEtikett`, `arendeStatusVagledning`)
 * och `lib/kategori.ts` (`kategoriEtikett`), så att en kund som senare loggar
 * in i kundportalen känner igen exakt samma ord för samma ärende. Ingen delad
 * kodbas mellan repona för det här - en medveten, liten dubblering (samma
 * princip som adminportalens egen `KATEGORI_ETIKETTER`-kopia).
 */

const STATUS_ETIKETTER: Record<string, string> = {
  ny: "Ny",
  pagaende: "Pågående",
  vantar_pa_kund: "Väntar på dig",
  bokad: "Bokad",
  lost: "Löst",
  stangd: "Stängd",
};

export function statusEtikett(status: string): string {
  return STATUS_ETIKETTER[status] ?? status;
}

export interface StatusVagledning {
  rubrik: string;
  beskrivning: string;
}

const STATUS_VAGLEDNING: Record<string, StatusVagledning> = {
  ny: {
    rubrik: "Vi går igenom ärendet",
    beskrivning: "Nova IT återkommer när ärendet har bedömts eller om vi behöver mer information.",
  },
  pagaende: {
    rubrik: "Vi arbetar med ärendet",
    beskrivning: "Nästa uppdatering kommer att synas här.",
  },
  vantar_pa_kund: {
    rubrik: "Vi behöver ditt svar",
    beskrivning:
      "Logga in i kundportalen för att läsa det senaste meddelandet och svara, så att vi kan gå vidare.",
  },
  bokad: {
    rubrik: "Nästa steg är bokat",
    beskrivning:
      "Logga in i kundportalen för tid, plats och eventuell förberedelse inför bokningen.",
  },
  lost: {
    rubrik: "Ärendet är löst",
    beskrivning: "Ingen ytterligare åtgärd krävs. Hör av dig igen om problemet återkommer.",
  },
  stangd: {
    rubrik: "Ärendet är avslutat",
    beskrivning: "Ingen ytterligare åtgärd krävs. Skapa ett nytt ärende om du behöver mer hjälp.",
  },
};

export function statusVagledning(status: string): StatusVagledning {
  return (
    STATUS_VAGLEDNING[status] ?? {
      rubrik: "Vi håller dig uppdaterad",
      beskrivning: "Nästa uppdatering kommer att synas här.",
    }
  );
}

const KATEGORI_ETIKETTER: Record<string, string> = {
  datorer_vardags_it: "Datorer och vardags-IT",
  natverk_wifi: "Nätverk och Wi-Fi",
  konton_moln_sakerhet: "Konton, moln och säkerhet",
  installation: "Installation och flytt",
  sakerhet_virus: "Virus och säkerhetsincident",
};

export function kategoriEtikett(kategori: string): string {
  return KATEGORI_ETIKETTER[kategori] ?? kategori;
}

/** Samma "tre grundsteg"-modell som kundportalens Framstegssparning
 *  (components/ui/framstegssparning.tsx) - bygger bara på statusar
 *  adminportalen faktiskt särskiljer. */
export const GRUNDSTEG = ["Mottaget", "Vi arbetar med det", "Klart"] as const;

export function aktivtGrundsteg(status: string): 0 | 1 | 2 {
  if (status === "ny") return 0;
  if (status === "lost" || status === "stangd") return 2;
  return 1;
}
